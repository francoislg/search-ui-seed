import { TemplatedFacet, ITemplatedFacetOptions } from '../../src/ui/TemplatedFacet';
import { Mock, Fake, Simulate } from 'coveo-search-ui-tests';
import { $$, InitializationEvents, QueryEvents, IBuildingQueryEventArgs } from 'coveo-search-ui';

describe('TemplatedFacet', () => {
    let templatedFacet: Mock.IBasicComponentSetup<TemplatedFacet>;

    beforeEach(() => {
        templatedFacet = Mock.basicComponentSetup<TemplatedFacet>(TemplatedFacet);
    });

    afterEach(() => {
        templatedFacet = null;
    });
});
