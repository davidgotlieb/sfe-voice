import {
  DialogflowApp,
  Contexts,
  DialogflowConversation,
} from 'actions-on-google';
import { RecallRepository } from '../../recall-alert-api/recall-repository';
import { RecentRecallsAllConversations } from '../../conversations/recent-recalls-all.conv';
import { RecentRecallsAllFollowupContext } from './contexts/recentrecalls-all-followup.context';
import {
  RecallSearchOptions,
  RecallCategory,
} from '../../recall-alert-api/models/recall-search-options';
import { IRecallSearchResult } from '../../recall-alert-api/models/recall-search-results';

export class RecallSearch {
  protected app: DialogflowApp<
    any,
    any,
    Contexts,
    DialogflowConversation<any, any, Contexts>
  >;

  /**
   *
   */
  constructor(
    app: DialogflowApp<
      any,
      any,
      Contexts,
      DialogflowConversation<any, any, Contexts>
    >
  ) {
    this.app = app;
  }

  public async ApplyIntent() {
    this.app.intent('recall - search', async (conv, { SearchTerm }) => {
      const repository = new RecallRepository();
      const conversation = new RecentRecallsAllConversations();
      let options: RecallSearchOptions;
      let searchRecallResults: IRecallSearchResult;
      const language =
        conv.user &&
        conv.user.locale &&
        conv.user.locale.substring(0, 2).toLowerCase() === 'fr'
          ? 'fr'
          : 'en';

      if (typeof SearchTerm === 'string') {
        options = new RecallSearchOptions(
          SearchTerm,
          RecallCategory.None,
          0,
          0,
          language
        );
        searchRecallResults = await repository.SearchRecalls(options);
      } else {
        searchRecallResults = {
          results: [],
          results_count: 0,
        };
      }

      if (
        searchRecallResults !== null &&
        searchRecallResults.results.length > 0
      ) {
        const context = new RecentRecallsAllFollowupContext(
          searchRecallResults.results
        );
        const recall = context.CurrentRecall;
        conv.contexts.set(
          RecentRecallsAllFollowupContext.ContextName,
          2,
          context as any
        );
        conv.ask(conversation.SayRecall(recall, language));
        return;
      } else if (
        searchRecallResults !== null &&
        searchRecallResults.results.length === 0
      ) {
        conv.ask(conversation.Say('noResults', language));
        return;
      }

      conv.ask(conversation.Say('seemsWrong', language));
      return;
    });
  }
}
