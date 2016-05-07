import * as assert from "power-assert";
import { add } from "../lib/index";

describe("test", function() {
    it("will succeed", function() {
        assert(add(1, 1) === 2);
    });
    it("will fail", function() {
        assert(add(1, 1) === 3);
    });
});