const { createClient } = require('@supabase/supabase-js');
const url = 'https://yossdcfgkfhnghoyjrpx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvc3NkY2Zna2Zobmdob3lqcnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjU5NjEsImV4cCI6MjA5MTEwMTk2MX0.HKAxx80p1xjN0g6oTU34ptGDgT2APyCR6CwA4QrZN7g';
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('team_members').select('*');
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
