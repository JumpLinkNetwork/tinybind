import "../scss/main.scss";

import { bs5Module } from "@ribajs/bs5";
import { coreModule, Riba } from "@ribajs/core";
import { extrasModule } from "@ribajs/extras";
import { Bs5TaggedImageDemoModule } from "./bs5-taggedimage-demo.module";

const riba = new Riba();
const model = {};

// Register modules
riba.module.regist(coreModule);
riba.module.regist(bs5Module.init({}));
riba.module.regist(extrasModule);
riba.module.regist(Bs5TaggedImageDemoModule);

riba.bind(document.body, model);
