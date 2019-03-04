import { DocumentClient } from 'aws-sdk/clients/dynamodb';
// import * as ApiGwManagementApi from 'aws-sdk/clients/apigatewaymanagementapi';
import { DynamoDBStreamEvent } from 'aws-lambda';

const documentClient = new DocumentClient();

if (!process.env.TABLE_NAME) {
    throw new Error('Environment variables "TABLE_NAME" must be set.');
}
const TABLE_NAME = process.env.TABLE_NAME;

export async function handler(event: DynamoDBStreamEvent): Promise<void> {
    console.log(`event: ${JSON.stringify(event)}`);

    // TODO: Get connection ids

    let queryParams: DocumentClient.QueryInput = {
        ExpressionAttributeNames: {
            '#type': 'type'
        },
        ExpressionAttributeValues: {
            ':type': 'connection'
        },
        KeyConditionExpression: '#type = :type',
        ProjectionExpression: 'id',
        TableName: TABLE_NAME
    };

    let queryResult = await documentClient.query(queryParams).promise();
    let connectionIds = (queryResult.Items || []).map(item => {
        return item.id;
    });

    console.log('connectionIds: ' + JSON.stringify(connectionIds));

    // let posts = event.Records.map( record => {
    //     let userId = (((record.dynamodb || {}).NewImage || {}).userId || {}).S;
    //     let message = (((record.dynamodb || {}).NewImage || {}).message || {}).S;

    //     let data = {
    //         userId: userId,
    //         message: message
    //     };

    //     await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: data }).promise();
    // });
}