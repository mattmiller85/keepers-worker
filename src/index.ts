import { Client } from 'elasticsearch';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../../keepers-server/src/config';
import { ErrorMessage, getTypedMessage, IndexingFinishedMessage, QueueForIndexingMessage } from '../../keepers-server/src/core/messages';
import { Queuer } from '../../keepers-server/src/queuer';
import { processor } from './processor';

const config = new Config();
const queuer = new Queuer(config);
console.log("Worker listening for documents to index...");
queuer.startWorking<QueueForIndexingMessage>(config.readyToIndexQueueName, async (item, done, error) => {
    const workingPath = path.join(config.workerWorkingDirectory, `${item.id}.jpg`);
    item.document.bytes = Buffer.from(item.document.image_enc, "base64");

    fs.writeFile(workingPath, item.document.bytes, async (err) => {
        if (err) {
            queuer.broadcastMessage(new ErrorMessage(err), config.documentIndexedFailedExchangeName);
            error(err.message);
            return;
        }
        const text = await processor(workingPath);
        item.document.text = text.replace(/\n/g, " ");

        const client = new Client({ host: config.elasticSearchUrl, log: "trace" });

        const result = await client.index(
            {
                index: 'documents',
                type: 'document',
                id: item.id,
                body: {
                    text: item.document.text,
                    image: item.document.image_enc,
                    tags: item.document.tags,
                },
            });
        item.document.image_enc = "";
        queuer.broadcastMessage(new IndexingFinishedMessage(item), config.documentIndexedExchangeName);
        done();
    });
});
