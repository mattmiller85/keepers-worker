import { Client } from 'elasticsearch';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../../keepers-server/src/config';
import { ErrorMessage, getTypedMessage, IndexingFinishedMessage, QueueForIndexingMessage } from '../../keepers-server/src/core/messages';
import { Queuer } from '../../keepers-server/src/queuer';
import { processor } from './processor';

const config = new Config();
const queuer = new Queuer(config);
queuer.startWorking<QueueForIndexingMessage>(config.readyToIndexQueueName, async (item, done, error) => {
    const workingPath = path.join(config.workerWorkingDirectory, `${item.id}.jpg`);
    if (!item.document.bytes || item.document.bytes.length === 0) {
        item.document.bytes = fs.readFileSync("C:\\Users\\matt.miller\\Pictures\\Capture.PNG");
    }
    fs.writeFile(workingPath, item.document.bytes, async (err) => {
        if (err) {
            queuer.broadcastMessage(new ErrorMessage(err), config.documentIndexedFailedExchangeName);
            return;
        }
        const text = await processor(workingPath);
        item.document.text = text;
        // Since we've ocr'd it ok, copy it to it's final resting place
        const client = new Client({ host: config.elasticSearchUrl, log: "trace" });
        const result = await client.index(
            {
                index: 'documents',
                type: 'document',
                id: item.document.id,
                body: {
                    text,
                    image: item.document.bytes,
                },
            });
        queuer.broadcastMessage(new IndexingFinishedMessage(item), config.documentIndexedExchangeName);
        done();
    });
});
