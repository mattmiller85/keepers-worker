import { assert } from 'chai';
import 'mocha';
import { processor } from '../src/processor';

describe("processor", () => {
    describe("exec", () => {
        it("should work", async () => {
            const text = await processor("C:\\Users\\matt.miller\\Pictures\\Capture.PNG");
            assert.isNotNull(text);
        });
    });
});
