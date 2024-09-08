import { Assignment, ButtonType } from "midi-mixer-plugin";
import {
  VoiceMeeter,
  VoiceMeeterType,
  OutParamData,
  OutParam,
  StripParamName,
} from "ts-easy-voicemeeter-remote";
import { convertGainToPad, convertGainToVolume, clampBar } from "./utils";

export const vm = new VoiceMeeter();

export class eAssignment extends Assignment {
  meterInterval: NodeJS.Timeout = {} as NodeJS.Timeout;
  updated = false;
  customAssignUpdate?: (data: OutParam) => void;
  customMuteUpdate?: (data: OutParam) => void;
  customRunUpdate?: (data: OutParam) => void;
}

// buttons will need to define how they are updated
export class eButton extends ButtonType {
  public update = (data: OutParamData): void => {
    // do nothing by default
  };
}

export const strip: eAssignment[] = [];
export const bus: eAssignment[] = [];
export const buttons: eButton[] = [];

export let stripCount = 0;
export let busCount = 0;

/**
 * Set the amount of assignable items according to which version of voicemeeter was detected
 *
 * @param version Detected version of voicemeeter
 */
export function setMeterCount(version: VoiceMeeterType): void {
  log.info(`Detected ${VoiceMeeterType[version]}`);
  switch (version) {
    case VoiceMeeterType.voiceMeeter:
      stripCount = 3;
      busCount = 2;
      break;
    case VoiceMeeterType.voiceMeeterBanana:
      stripCount = 5;
      busCount = 5;
      break;
    case VoiceMeeterType.voiceMeeterPotato:
      stripCount = 8;
      busCount = 8;
      break;
    default:
      stripCount = 0;
      busCount = 0;
  }
}

interface Settings {
  maxdb: number;
  mindb: number;
  minpan: number;
  maxpan: number;
  reverbLevel: number;
  delayLevel: number;
  busToggles: string;
  customStripAssign: string;
  customStripMute: string;
  customStripRun: string;
}

export let settings: Settings;

export async function initSettings(): Promise<void> {
  const config: Record<string, any> = await $MM.getSettings();
  // "fallback" plugin setting doesn't seem to work
  settings = {
    maxdb: isNaN(parseFloat(config["maxdb"]))
      ? 12
      : parseFloat(config["maxdb"]),
    mindb: isNaN(parseFloat(config["mindb"]))
      ? -60
      : parseFloat(config["mindb"]),
    minpan: parseFloat(config['minpan']),
    maxpan: parseFloat(config['maxpan']),
    reverbLevel: parseFloat(config['reverbLevel']),
    delayLevel: parseFloat(config['delayLevel']),
    busToggles: config["BusToggles"],
    customStripAssign: config["customStripAssign"],
    customStripMute: config["customStripMute"],
    customStripRun: config["customStripRun"],
  };
  console.log(settings);
}




// check parameters: https://github.com/Jaggernaut555/ts-easy-voicemeeter-remote/blob/master/src/ioFuncs.ts


export const eqs: eAssignment[] = [];
export const eq_names: StripParamName[] = ['EQGain1', 'EQGain2', 'EQGain3']

export function init_eqs(strips: OutParam[]): void {
  for (let i = 0; i < 3; i++) {
    eqs[i] = new eAssignment(`EQ ${i}`, {
      name: `EQ ${i}`,
      volume: 0.5,
    });

    eqs[i].on("volumeChanged", (level: number) => {
      eqs[i].updated = true;
      eqs[i].volume = level;
      vm.setStripParameter(eq_names[i], 5, convertGainToPad(level));
      vm.setStripParameter(eq_names[i], 6, convertGainToPad(level));
      vm.setStripParameter(eq_names[i], 7, convertGainToPad(level));
    });

    eqs[i].on("assignPressed", () => {
      eqs[i].updated = true;
      eqs[i].volume = 0.5;
      vm.setStripParameter(eq_names[i], 5, 0);
      vm.setStripParameter(eq_names[i], 6, 0);
      vm.setStripParameter(eq_names[i], 7, 0);
    });


    clearInterval(eqs[i].meterInterval);
    eqs[i].meterInterval = setInterval(() => {
      const rawLevel = vm.getLevelByID(2, i);
      const averageLevel = ((rawLevel?.r ?? 0) + (rawLevel?.l ?? 0)) / 2;
      const meterLevel = averageLevel / 60;
      const clampedVal = clampBar(meterLevel);
      if (clampedVal !== 0) {
        eqs[i].meter = clampedVal;
      }
    }, eqs[i].throttle);
  }
}




