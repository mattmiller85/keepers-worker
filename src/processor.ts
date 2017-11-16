// tslint:disable-next-line:no-var-requires
const tesseract = require('node-tesseract');
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../../keepers-server/src/config';
import { ErrorMessage, getTypedMessage, IndexingFinishedMessage, QueueForIndexingMessage } from '../../keepers-server/src/core/messages';

export function processor(workingPath: string): Promise<string> {
    const options = {
        binary: "\"C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe\"",
    };
    return new Promise<string>((resolve, reject) => {
        tesseract.process(workingPath, options, (failed: any, text: string) => {
            if (failed) {
                console.error(failed);
                reject(JSON.stringify(failed));
            } else {
                resolve(text);
            }
        });
    });
}
