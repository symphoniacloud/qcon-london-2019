import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { ApiGatewayManagementApi } from 'aws-sdk/clients/all';
import { DynamoDBStreamEvent } from 'aws-lambda';

const documentClient = new DocumentClient();

if (!process.env.CONNECTIONS_TABLE) {
    throw new Error('Environment variables "CONNECTIONS_TABLE" must be set.');
}
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

if (!process.env.REGION) {
    throw new Error('Environment variables "REGION" must be set.');
}
const REGION = process.env.REGION;

if (!process.env.WEB_SOCKETS_ENDPOINT) {
    throw new Error('Environment variables "WEB_SOCKETS_ENDPOINT" must be set.');
}
const WEB_SOCKETS_ENDPOINT = process.env.WEB_SOCKETS_ENDPOINT;

const mgmtApi = new ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: WEB_SOCKETS_ENDPOINT
});

export async function handler(event: DynamoDBStreamEvent): Promise<void> {
    console.log(`event: ${JSON.stringify(event)}`);

    let scanParams: DocumentClient.ScanInput = {
        TableName: CONNECTIONS_TABLE
    };
    let scanResult = await documentClient.scan(scanParams).promise();

    let connectionIds = (scanResult.Items || []).map(item => {
        return item.id;
    });

    console.log('connectionIds: ' + JSON.stringify(connectionIds));

    let messages = event.Records.map(record => {
        let id = (((record.dynamodb || {}).NewImage || {}).id || {}).S;
        let ts = (((record.dynamodb || {}).NewImage || {}).ts || {}).N;
        let message = (((record.dynamodb || {}).NewImage || {}).message || {}).S;
        let source = (((record.dynamodb || {}).NewImage || {}).source || {}).S;

        return {
            id: id,
            ts: ts,
            message: message,
            source: source,
            region: REGION
        };
    });

    let uniqueMessages = messages.filter((a, idx, arr) => {
        return arr.findIndex(b => a.id === b.id) === idx;
    });

    console.log(`uniqueMessages: ${JSON.stringify(uniqueMessages)}`);

    let posts = connectionIds.map(async (connectionId) => {
        try {
            console.log(`sending messages to ${connectionId}`);
            await mgmtApi.postToConnection({
                ConnectionId: connectionId,
                Data: JSON.stringify(uniqueMessages)
            }).promise();
        } catch (err) {
            console.log(`err: ${JSON.stringify(err)}`);
            if (err.statusCode === 410) {
                console.log(`stale: ${connectionId}`)
                await documentClient.delete({
                    TableName: CONNECTIONS_TABLE,
                    Key: { id: connectionId }
                }).promise();
            } else {
                throw err;
            }
        }
    });

    let results = await Promise.all(posts);
    console.log(`results: ${JSON.stringify(results)}`);
}