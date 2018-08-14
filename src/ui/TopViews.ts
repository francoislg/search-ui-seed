import {
  Component,
  ComponentOptions,
  IComponentBindings,
  Template,
  Initialization,
  TemplateCache,
  InitializationEvents,
  UrlUtils,
  IAnalyticsEndpointOptions,
  AnalyticsEndpoint,
  ISuccessResponse,
  $$,
  Dom,
  IQueryResult,
  Assert
} from 'coveo-search-ui';

export type IDimensionsCombinations<TDimensions extends string> = {
  [key in TDimensions]: string;
};

export type IMetricsCombinations<TMetrics extends string> = {
  [key in TMetrics]: number;
};

export type ICombinations<TDimensions extends string, TMetrics extends string> = IDimensionsCombinations<TDimensions> & IMetricsCombinations<TMetrics>;

export interface ICombinedDataResponse<TDimensions extends string, TMetrics extends string> {
  combinations: ICombinations<TDimensions, TMetrics>[];
  totalNumberOfResults: number;
  lastUpdated: number;
  cached: boolean;
}

export type ITopViewsDimensions = 'documentTitle' | 'documentURL';
export type ITopViewsMetrics = 'DocumentView';

export type ITopViewsCombinedDataResponse = ICombinedDataResponse<ITopViewsDimensions, ITopViewsMetrics>;

export interface ITopViewsOptions {
  apiKey: string;
  title: string;
  template: Template;
  numberOfResults: number;
  richResults: boolean;
}

export class TopViews extends Component {
  static ID = 'TopViews';

  static options: ITopViewsOptions = {
    apiKey: ComponentOptions.buildStringOption({
      required: true
    }),
    title: ComponentOptions.buildStringOption({
      defaultValue: 'Top Viewed Documents'
    }),
    template: ComponentOptions.buildTemplateOption({
      defaultFunction: () => TemplateCache.getDefaultTemplate('Card')
    }),
    numberOfResults: ComponentOptions.buildNumberOption({
      defaultValue: 5
    }),
    richResults: ComponentOptions.buildBooleanOption({
      defaultValue: false
    })
  };

  private resultsHeader: Dom;
  private resultsContainer: Dom;

  constructor(public element: HTMLElement, public options: ITopViewsOptions, public bindings: IComponentBindings) {
    super(element, TopViews.ID, bindings);
    this.options = ComponentOptions.initComponentOptions(element, TopViews, options);

    Assert.check(!!this.bindings.usageAnalytics, 'The CoveoAnalytics component must be included to use the TopViews component');

    this.bind.onRootElement(InitializationEvents.afterInitialization, () => this.initComponent());

    this.resultsHeader = this.createResultsHeader();
    this.resultsContainer = this.createContainer();

    this.element.appendChild(this.resultsHeader.el);
    this.element.appendChild(this.resultsContainer.el);
  }

  private async initComponent() {
    const combinedData = await this.callCombinedData<ITopViewsDimensions, ITopViewsMetrics>(['documentTitle', 'documentURL'], ['DocumentView']);

    this.emptyContainer();

    combinedData.data.combinations
      .map((c, i) => this.mapCombinationToQueryResult(c, i))
      .map(async queryResult => {
        const element = await this.options.template.instantiateToElement(queryResult);
        Component.bindResultToElement(element, queryResult);
        await Initialization.automaticallyCreateComponentsInsideResult(element, queryResult).initResult;
        return element;
      })
      .forEach(async template => this.resultsContainer.append(await template));
  }

  private createResultsHeader(): Dom {
    const title = $$('div', {
      class: 'coveo-recommendation-title'
    }, this.options.title);
    return $$('div', {
      class: 'coveo-recommendation-header'
    }, title);
  }

  private createContainer(): Dom {
    return $$('div');
  }

  private emptyContainer(): void {
    this.resultsContainer.empty();
  }

  private mapCombinationToQueryResult(combination: ICombinations<ITopViewsDimensions, ITopViewsMetrics>, index: number): IQueryResult {
    return {
      childResults: [],
      clickUri: combination.documentURL,
      excerpt: '',
      excerptHighlights: [],
      firstSentences: '',
      firstSentencesHighlights: [],
      flags: '',
      hasHtmlVersion: false,
      hasMobileHtmlVersion: false,
      index: index,
      isRecommendation: false,
      isTopResult: false,
      phrasesToHighlight: {},
      printableUri: combination.documentURL,
      printableUriHighlights: [],
      rankingInfo: '',
      raw: {
        ...combination,
        printableUri: combination.documentURL,
        uri: combination.documentURL
      },
      searchInterface: this.searchInterface,
      state: {},
      summary: '',
      summaryHighlights: [],
      title: combination.documentTitle,
      titleHighlights: [],
      uniqueId: combination.documentURL,
      uri: combination.documentURL
    };
  }

  private async callCombinedData<TDimensions extends string, TMetrics extends string>(dimensions: TDimensions[], metrics: TMetrics[]): Promise<ISuccessResponse<ICombinedDataResponse<TDimensions, TMetrics>>> {
    const { options } = this.bindings.usageAnalytics.endpoint;
    const endpoint = new AnalyticsEndpoint({
      ...options, accessToken: {
        token: this.options.apiKey,
        doRenew: (onError?: (error: Error) => void): Promise<Boolean> => Promise.resolve(true),
        renew: null,
        isExpired: (error) => false,
        subscribeToRenewal: (onTokenRefreshed) => { }
      }
    });
    const normalizedUrl = this.buildAnalyticsUrl(options, '/stats/combinedData', {
      org: options.organization,
      from: '2018-07-14T00:00:00.000-0400',
      to: '2018-08-13T23:59:59.999-0400',
      f: `(documenturl!='' AND documenturl!=null)`,
      p: 1,
      n: this.options.numberOfResults,
      s: 'DocumentView',
      asc: false,
      includeMetadata: true,
      tz: 'Z',
      format: 'JSON'
    });
    const metricsQueryString = metrics.map(m => `m=${m}`);
    const dimensionsQueryString = dimensions.map(d => `d=${d}`);
    const queryString = normalizedUrl.queryNormalized
      .concat(dimensionsQueryString)
      .concat(metricsQueryString);

    return await endpoint.endpointCaller.call<ICombinedDataResponse<TDimensions, TMetrics>>({
      errorsAsSuccess: false,
      url: normalizedUrl.path,
      method: 'GET',
      requestData: {},
      queryString: queryString,
      responseType: 'text',
      requestDataType: 'application/json'
    });
  }

  private buildAnalyticsUrl(endpointOptions: IAnalyticsEndpointOptions, path: string, queryParams: any) {
    return UrlUtils.normalizeAsParts({
      paths: [
        endpointOptions.serviceUrl,
        '/rest/',
        AnalyticsEndpoint.CUSTOM_ANALYTICS_VERSION || AnalyticsEndpoint.DEFAULT_ANALYTICS_VERSION,
        path
      ],
      query: queryParams
    });
  }
}

Initialization.registerAutoCreateComponent(TopViews);
