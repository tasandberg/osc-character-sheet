import { KvCard } from "./Card";
import { Stamp } from "./Stamp";

export default { title: "Layout / KvCard" };

// A compact key/value tile — an ink stamp over a big value (e.g. an ability score).
export const KeyValue = () => (
  <KvCard>
    <div className="head">
      <Stamp>STR</Stamp>
    </div>
    <div className="val">16</div>
  </KvCard>
);
