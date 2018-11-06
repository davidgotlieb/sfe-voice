import { HandlerInput, RequestHandler } from 'ask-sdk';
import { IntentRequest, Response } from 'ask-sdk-model';
import { RecallRepository } from '../../recall-alert-api/recall-repository';
import {
  RecallSearchOptions,
  RecallCategory,
} from '../../recall-alert-api/models/recall-search-options';

export class SearchRecallHandler implements RequestHandler {
  private readonly RecallMethod: string = 'RecallMethod';
  private readonly SearchTerm: string = 'SearchTerm';

  public canHandle(handlerInput: HandlerInput): boolean | Promise<boolean> {
    const request = handlerInput.requestEnvelope.request;

    return (
      request.type === 'IntentRequest' &&
      request.intent.name === 'SearchResponseIntent'
    );
  }

  public async handle(handlerInput: HandlerInput): Promise<Response> {
    const responseBuilder = handlerInput.responseBuilder;
    const request = handlerInput.requestEnvelope.request as IntentRequest;
    const intent = request.intent;
    const search =
      intent && intent.slots && intent.slots.Search && intent.slots.Search.value
        ? intent.slots.Search.value
        : 'SR';
    const language = request.locale.toLowerCase() === 'fr-ca' ? 'fr' : 'en';
    let searchType: string = 'SearchRecalls';
    handlerInput.attributesManager.setSessionAttributes({
      [this.RecallMethod]: searchType,
      [this.SearchTerm]: search.toString(),
    });

    const repository = new RecallRepository();
    let message: string = '';

    search.toString();

    message += `Sure, `;

    let searchName = search;

    const options = new RecallSearchOptions(
      searchName,
      RecallCategory.None,
      1,
      0,
      language
    );

    const result = await repository.SearchRecalls(options);
    let counter: number = 0;
    const askAgain: string = 'Would you like to hear the next recall?';

    if (!result) {
      message += `Something went wrong`;
    } else {
      message += `${result.results[0].title} .`;
    }

    return responseBuilder
      .speak(message + askAgain)
      .reprompt(askAgain)
      .withSimpleCard('Sample Recall Test', message)
      .getResponse();
  }
}
