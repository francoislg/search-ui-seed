import { TopViews, ITopViewsOptions } from '../../src/ui/TopViews';
import { Mock, Fake, Simulate } from 'coveo-search-ui-tests';
import { $$, InitializationEvents, QueryEvents, IBuildingQueryEventArgs } from 'coveo-search-ui';

describe('TopViews', () => {
    let topViews: Mock.IBasicComponentSetup<TopViews>;

    beforeEach(() => {
        topViews = Mock.basicComponentSetup<TopViews>(TopViews);
    });

    afterEach(() => {
        topViews = null;
    });
});
