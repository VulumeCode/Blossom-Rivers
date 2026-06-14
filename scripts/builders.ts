// Registry of named CPU player builders, shared by the match harness
// (cpu-match.ts) and the ranking harness (cpu-rank.ts).
//
// Kept in its own module — free of any top-level side effects — so it can be
// imported from the main thread without pulling in cpu-match.ts's `main()`.

import {
    type CPUPlayer,
    evaluateRolloutCut,
    evaluateRolloutInv,
    evaluateRolloutDiv,
    evaluateRolloutSigmoidS,
    evaluateRolloutSigmoidSW,
    randomizeRedealOppCaptures,
    randomizeRedealOppBlurOwnCaptures,
    randomizeBlurBothCaptures,
} from "../src/cpu/cpu";
import { RandomPlayer } from "../src/cpu/random";
import { RandomLegalPlayer } from "../src/cpu/random_legal";
import { SimpleMCTSPlayer } from "../src/cpu/simple_mcts";
import { ISMCTSPlayer } from "../src/cpu/ismcts";
import { MOISMCTSPlayer } from "../src/cpu/mo_ismcts";
import { ISMCTSObsPlayer } from "../src/cpu/ismcts_obs";
import { MOISMCTSObsPlayer } from "../src/cpu/mo_ismcts_obs";

export type Builder = () => CPUPlayer;

export const BUILDERS: Record<string, Builder> = {
    randomsb: () => new RandomPlayer(),
    simplesb: () => new SimpleMCTSPlayer(),
    simpleblur: () => new SimpleMCTSPlayer({ randomize: randomizeBlurBothCaptures }),
    // simplejb: () => new SimpleMCTSPlayer({ junk_bias: true }),
    simplercsb: () => new SimpleMCTSPlayer({ randomize: randomizeRedealOppCaptures }),
    simpleracsb: () => new SimpleMCTSPlayer({ randomize: randomizeRedealOppBlurOwnCaptures }),

    // // random: () => new RandomPlayer({ stop_bias: false }),
    // // randomL: () => new RandomLegalPlayer(),
    // // simple: () => new SimpleMCTSPlayer({ stop_bias: false }),
    // // simplerc: () => new SimpleMCTSPlayer({ stop_bias: false, randomize: randomizeRedealOppCaptures }),
    // // simplerac: () => new SimpleMCTSPlayer({ stop_bias: false, randomize: randomizeRedealOppBlurOwnCaptures }),
    // simplec: () => new SimpleMCTSPlayer({ evaluateRollout: evaluateRolloutCut }),
    // // simpled: () => new SimpleMCTSPlayer({ stop_bias: false, evaluateRollout: evaluateRolloutDiv }),
    // simplesbd: () => new SimpleMCTSPlayer({ evaluateRollout: evaluateRolloutDiv }),
    // // simplei: () => new SimpleMCTSPlayer({ stop_bias: false, evaluateRollout: evaluateRolloutInv }),
    // simplesbi: () => new SimpleMCTSPlayer({ evaluateRollout: evaluateRolloutInv }),
    // simplesbs: () => new SimpleMCTSPlayer({ evaluateRollout: evaluateRolloutSigmoidS }),
    // simplesbsw: () => new SimpleMCTSPlayer({ evaluateRollout: evaluateRolloutSigmoidSW }),
    // simplebd: () => new SimpleMCTSPlayer({
    //     budget: {
    //         DEALING: 200,
    //         CAPTURING: 4000,
    //         FORCED_CAPTURE: 2000,
    //         YAKU_CHOICE: 20000,
    //     }
    // }),
    // sois: () => new ISMCTSPlayer(),
    // mois: () => new MOISMCTSPlayer(),
    // soisobs: () => new ISMCTSObsPlayer({ stop_bias: false }),
    // soisobssb: () => new ISMCTSObsPlayer(),
    // moisobs: () => new MOISMCTSObsPlayer(),
};
