global.WebSocket = class {};
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnnncdnpdqdylyqyyuxm.supabase.co';
const supabaseKey = 'sb_publishable_Yj8aNqFLYog19BFk7TBCRQ_43BGBz_7';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  try {
    const testUserId = '1237d3ca-54f2-41ec-9f34-705d00ca87ae'; // Admin UUID
    
    console.log('Testing direct upsert on subscriptions table...');
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: testUserId,
        plan: 'advanced',
        status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select();
      
    if (error) {
      console.log('Upsert failed with error:', error);
    } else {
      console.log('Upsert succeeded:', data);
    }
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testUpdate();
