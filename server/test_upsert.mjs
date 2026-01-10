
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
    console.log('Testing upsert without logo_url and tax_rates...');
    const dbPayload = {
        store_name: 'Test'
    };

    const { error } = await supabase
        .from('store_settings')
        .upsert({ id: 1, ...dbPayload });

    if (error) {
        console.error('Upsert failed even with minimal payload:', error);
    } else {
        console.log('Upsert succeeded with minimal payload.');

        console.log('Testing upsert with logo_url...');
        const { error: errorLogo } = await supabase
            .from('store_settings')
            .upsert({ id: 1, logo_url: 'test' });

        if (errorLogo) console.error('Logo URL test failed:', errorLogo.message);
        else console.log('Logo URL test succeeded.');

        console.log('Testing upsert with tax_rates...');
        const { error: errorTax } = await supabase
            .from('store_settings')
            .upsert({ id: 1, tax_rates: {} });

        if (errorTax) console.error('Tax Rates test failed:', errorTax.message);
        else console.log('Tax Rates test succeeded.');
    }
}

testUpsert();
