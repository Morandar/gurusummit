#!/usr/bin/env node

// Test script to debug the visits query issue
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || 'https://jclbonbkpthbckjctyre.supabase.co';
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  },
});

async function testQueries() {
  console.log('🧪 Testing Supabase queries...\n');

  try {
    // Test 1: Simple select all from visits
    console.log('1️⃣ Testing SELECT * from visits...');
    const { data: visitsData, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .limit(5);

    if (visitsError) {
      console.error('❌ SELECT * error:', visitsError);
    } else {
      console.log('✅ SELECT * success:', visitsData?.length || 0, 'records');
    }

    // Test 2: Specific query like in the app
    console.log('\n2️⃣ Testing specific query (booth_id=1, attendee_id=1)...');
    const { data: specificData, error: specificError } = await supabase
      .from('visits')
      .select('id')
      .eq('booth_id', 1)
      .eq('attendee_id', 1);

    if (specificError) {
      console.error('❌ Specific query error:', specificError);
    } else {
      console.log('✅ Specific query success:', specificData);
    }

    // Test 3: INSERT query (to confirm writing works)
    console.log('\n3️⃣ Testing INSERT into visits...');
    const testVisit = {
      booth_id: 999,
      attendee_id: 999,
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('visits')
      .insert([testVisit])
      .select();

    if (insertError) {
      console.error('❌ INSERT error:', insertError);
    } else {
      console.log('✅ INSERT success:', insertData);

      // Clean up test record
      if (insertData && insertData[0]?.id) {
        await supabase.from('visits').delete().eq('id', insertData[0].id);
        console.log('🧹 Cleaned up test record');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testQueries();