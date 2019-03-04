import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

if (!process.env.CONNECTIONS_TABLE) {
    throw new Error('Environment variables "CONNECTIONS_TABLE" must be set.');
}
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

const documentClient = new DocumentClient();

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {

    let params: DocumentClient.PutItemInput = {
        TableName: CONNECTIONS_TABLE,
        Item: {
            id: event.requestContext.connectionId
        }
    };

    console.log(`params: ${JSON.stringify(params)}`)

    try {
        let putResponse = await documentClient.put(params).promise();
        console.log(`putResponse: ${JSON.stringify(putResponse)}`);

        return {
            statusCode: 200,
            body: 'Connect ok'
        };
    } catch (err) {
        console.log(`err: ${JSON.stringify(err)}`);
        return {
            statusCode: 500,
            body: `err: ${JSON.stringify(err)}`
        };
    }
};