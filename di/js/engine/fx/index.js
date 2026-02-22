// /di/js/engine/fx/index.js
import { FXCore } from "./core.js";
import { attachBurst } from "./burst.js";
import { attachStream } from "./stream.js";
import { attachHeartbeat } from "./heartbeat.js";
import { attachDivine } from "./divine.js";

attachBurst(FXCore);
attachStream(FXCore);
attachHeartbeat(FXCore);
attachDivine(FXCore);

export { FXCore };
