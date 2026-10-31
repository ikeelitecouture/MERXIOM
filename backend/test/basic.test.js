const test=require('node:test');const assert=require('node:assert/strict');
test('Paystack webhook rejects absent signature',()=>{const p=require('../src/services/paystack');assert.equal(p.validWebhook(Buffer.from('{}'),undefined),false)});
test('models export expected commerce entities',{skip:(()=>{try{require.resolve('mongoose');return false}catch{return 'mongoose dependency is not installed in this test environment'}})()},()=>{const m=require('../src/models');for(const k of ['User','Product','Category','Order','RFQ','Conversation','BrainMemory'])assert.equal(typeof m[k],'function')});

test('courier options are normalized with provider-qualified IDs and numeric prices',()=>{
  const couriers=require('../src/services/couriers');
  const quote=couriers.normalizeOptions('gokada',{options:[
    {id:'quote-1',price:'1250',carrier_name:'Gokada Express',eta:'same day'},
    {id:'bad',price:'not-a-price'}
  ]});
  assert.equal(quote.options.length,1);
  assert.equal(quote.options[0].id,'gokada::quote-1');
  assert.equal(quote.options[0].providerId,'gokada');
  assert.equal(quote.options[0].price,1250);
});

test('Chowdeck Relay adapter quotes in naira from documented kobo responses',async()=>{
  const couriers=require('../src/services/couriers');
  const previousKey=process.env.CHOWDECK_RELAY_API_KEY;
  const previousFetch=global.fetch;
  process.env.CHOWDECK_RELAY_API_KEY='test-key';
  global.fetch=async(url,options)=>({
    ok:true,status:200,
    json:async()=>({status:'success',data:{id:4321,total_amount:75500}})
  });
  try{
    const quote=await couriers.get('chowdeck-relay').quote({
      origin:{address:'Pickup, Lagos'},destination:{address:'Dropoff, Lagos'},declaredValue:12000
    });
    assert.equal(quote.options[0].providerOptionId,'4321');
    assert.equal(quote.options[0].price,755);
    assert.equal(quote.options[0].id,'chowdeck-relay::4321');
  }finally{
    global.fetch=previousFetch;
    if(previousKey===undefined)delete process.env.CHOWDECK_RELAY_API_KEY;
    else process.env.CHOWDECK_RELAY_API_KEY=previousKey;
  }
});
