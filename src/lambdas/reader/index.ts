 import { DocumentClient } from 'aws-sdk/clients/dynamodb';
 import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
 
 const documentClient = new DocumentClient();
 
 if (! process.env.TABLE_NAME) {
     throw new Error('Environment variables "TABLE_NAME" must be set.');
 }
 const TABLE_NAME = process.env.TABLE_NAME;
 
 export async function handler ({ pathParameters }: APIGatewayProxyEvent ): Promise<APIGatewayProxyResult> {
     if (pathParameters && pathParameters.id) {
         try {
             const response = await documentClient.get({
                 TableName: TABLE_NAME,
                 Key: {
                     id: pathParameters.id
                 }
             }).promise();
             if (response) {
                 return {
                     statusCode: 200,
                     body: JSON.stringify(response.Item)
                 };
             } else {
                 return {
                     statusCode: 500,
                     body: 'Error awaiting response from database.'
                 };
             }
         } catch (err) {
             return {
                 statusCode: 500,
                 body: `Error reading from '${ TABLE_NAME }': ${ err }`
             };
         }
     } else {
         return {
             statusCode: 400,
             body: 'Malformed request'
         };
     }
 }
 
 