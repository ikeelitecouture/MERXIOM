const test=require('node:test');
const assert=require('node:assert/strict');

test('Paystack webhook rejects absent signature',()=>{
  const p=require('../src/services/paystack');
  assert.equal(p.validWebhook(Buffer.from('{}'),undefined),false);
});

test('models export expected commerce entities',{skip:(()=>{
  try{require.resolve('mongoose');return false}
  catch{return 'mongoose dependency is not installed in this test environment'}
})()},()=>{
  const m=require('../src/models');
  for(const k of ['User','Product','Category','Order','RFQ','Conversation','BrainMemory']) assert.equal(typeof m[k],'function');
});

test('only Fez and iClose are registered as active couriers',()=>{
  const couriers=require('../src/services/couriers');
  assert.ok(couriers.get('fez'));
  assert.ok(couriers.get('iclose'));
  assert.equal(couriers.get('chowdeck-relay'),null);
  assert.equal(couriers.get('gokada'),null);
  assert.throws(()=>couriers.normalizeOptions('gokada',{options:[]}),/Unsupported courier/);
});

test('delivery quote token is signed and bound to the user, cart and full address',()=>{
  process.env.JWT_SECRET='test-secret-with-at-least-thirty-two-characters';
  const q=require('../src/services/quote-token');
  const items=[{productId:'product-1',quantity:2}];
  const address={recipient:'Buyer',phone:'08000000000',line1:'1 Main Street',city:'Lagos',state:'Lagos',country:'Nigeria'};
  const fingerprint=q.requestFingerprint('buyer-1',items,address);
  const signed=q.createQuoteToken({providerId:'fez',userId:'buyer-1',fingerprint,quotes:[]});
  const decoded=q.readQuoteToken(signed.token);
  assert.equal(decoded.userId,'buyer-1');
  assert.equal(decoded.fingerprint,fingerprint);
  assert.equal(q.readQuoteToken(signed.token+'x'),null);
  assert.notEqual(fingerprint,q.requestFingerprint('buyer-2',items,address));
  assert.notEqual(fingerprint,q.requestFingerprint('buyer-1',items,{...address,line1:'2 Other Street'}));
  assert.notEqual(fingerprint,q.requestFingerprint('buyer-1',[{productId:'product-1',quantity:1}],address));
});

test('iClose only maps documented state names and accepts explicit confirmed codes',()=>{
  const iclose=require('../src/services/iclose');
  assert.equal(iclose.stateCode('Lagos'),'ng-la');
  assert.equal(iclose.stateCode('ng-og'),'ng-og');
  assert.throws(()=>iclose.stateCode('Ogun'),/not configured/);
});
