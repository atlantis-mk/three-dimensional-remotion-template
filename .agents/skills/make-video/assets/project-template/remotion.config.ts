import {Config} from '@remotion/cli/config';
// 三维场景需要 WebGL；angle 在 macOS 上最稳定，无 GPU 的 Linux 可改为 'swangle'。
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
