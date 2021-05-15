require('dotenv').config();

import { getUpstreamFactoryAddress, getUpstreamTemplateAddress } from '../src/deployUtil';
import { addTemplate } from '../src/addTemplate';

(async function(){
    const codename1 = 'BulksaleV1';
    await addTemplate(
        codename1,
        uptreamFactoryAddressPath(),
        getUpstreamTemplateAddress(codename1)
    );

})().then()
