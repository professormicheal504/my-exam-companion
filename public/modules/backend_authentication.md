# Supabase Global Authentication (OTP) Guide

This document outlines the complete architecture and implementation steps to set up a robust, multi-country authentication system using Supabase. It supports **One-Time Passwords (OTP)** via Email and SMS (Phone).

---

## 1. Supabase Dashboard Configuration

Before writing code, you must configure your Supabase project to allow global authentication.

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Navigate to **Project Settings -> API** to find your `Project URL` and `anon public` API key. You will need these for the frontend.

### Step 2: Enable Authentication Providers
1. In the Supabase Dashboard, go to **Authentication -> Providers**.
2. **Email OTP (Free & Global):**
   - Ensure the **Email** provider is enabled.
   - Turn on **Enable Email OTP** (Magic Links).
3. **Phone OTP (Requires 3rd Party Provider):**
   - Enable the **Phone** provider.
   - Supabase does not send SMS directly. You must configure an SMS provider like **Twilio** or **MessageBird**.
   - **Twilio Setup:** 
     - Create a Twilio account, buy a phone number, and grab your `Account SID` and `Auth Token`.
     - In Supabase -> Phone Provider, select Twilio and paste your credentials. 
     - *Note: Twilio supports global SMS routing, ensuring users in any country can receive the OTP.*

### Step 3: Google Auth Setup (OAuth)
To allow users to sign in with Google, you need to configure OAuth credentials in the Google Cloud Console.

1. **Get your Supabase Callback URL:**
   - In Supabase, go to **Authentication -> Providers -> Google**.
   - Under the configuration settings, copy the **Callback URL** (e.g., `https://alwplfsqzrijxqujrpyu.supabase.co/auth/v1/callback`).
2. **Create Google Cloud Credentials:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one.
   - Go to **APIs & Services -> OAuth consent screen** and configure it (set to "External" if you want anyone to log in).
   - Go to **APIs & Services -> Credentials**.
   - Click **Create Credentials -> OAuth client ID**.
   - Choose **Web application** as the application type.
   - Under **Authorized redirect URIs**, paste the Supabase Callback URL you copied in step 1.
   - Click **Create**. Google will give you a **Client ID** and a **Client Secret**.
3. **Enable Google in Supabase:**
   - Go back to the Supabase Dashboard -> **Authentication -> Providers -> Google**.
   - Toggle it on.
   - Paste the **Client ID** and **Client Secret** from Google.
   - Click **Save**. Google Auth is now active!

### Step 3: Database User Profiles (Optional but Recommended)
Supabase handles raw auth in a secure `auth.users` schema. To store app-specific data (like the user's country), create a public `profiles` table.

Run this SQL in the Supabase **SQL Editor**:

```sql
-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  phone text,
  email text,
  country text,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Automatically create a profile when a new user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone, email)
  values (new.id, new.phone, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 2. Frontend Implementation

Below is the HTML and JavaScript required to implement global Phone/Email OTP in your application.

### Step 1: Include the Supabase JS Library
In your `index.html` or authentication HTML file, add the Supabase CDN script in the `<head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Step 2: HTML Structure for Country Code & OTP
You need a dropdown for country codes to ensure phone numbers are formatted correctly (e.g., `+234` for Nigeria, `+1` for USA).

```html
<!-- auth.html -->
<div id="auth-container">
  <h2>Login / Sign Up</h2>
  
  <!-- Step 1: Request OTP -->
  <div id="request-otp-section">
    <label for="country-code">Country</label>
    <select id="country-code">
      <option value="+234">Nigeria (+234)</option>
      <option value="+1">USA/Canada (+1)</option>
      <option value="+44">UK (+44)</option>
      <option value="+91">India (+91)</option>
      <!-- Add more countries or use a library like intl-tel-input -->
    </select>

    <label for="phone-input">Phone Number</label>
    <input type="tel" id="phone-input" placeholder="8012345678" />
    
    <button onclick="requestOTP()">Send OTP</button>
  </div>

  <!-- Step 2: Verify OTP (Hidden initially) -->
  <div id="verify-otp-section" style="display: none;">
    <label for="otp-input">Enter 6-digit Code</label>
    <input type="text" id="otp-input" placeholder="123456" />
    <button onclick="verifyOTP()">Verify & Login</button>
  </div>
</div>
```

### Step 3: JavaScript Authentication Logic
Initialize the Supabase client and write the functions to handle sending and verifying the OTP.

```javascript
// Initialize Supabase Client
const SUPABASE_URL = 'https://xyzcompany.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR...'; // Replace with your anon key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentPhoneNumber = '';

// 1. Request the OTP
async function requestOTP() {
  const countryCode = document.getElementById('country-code').value;
  const rawPhone = document.getElementById('phone-input').value.replace(/^0+/, ''); // Remove leading zero
  
  // Combine country code and phone number (e.g., +2348012345678)
  currentPhoneNumber = `${countryCode}${rawPhone}`;

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: currentPhoneNumber,
    });

    if (error) throw error;

    alert('OTP Sent successfully to ' + currentPhoneNumber);
    
    // Switch UI to verification step
    document.getElementById('request-otp-section').style.display = 'none';
    document.getElementById('verify-otp-section').style.display = 'block';

  } catch (error) {
    console.error('Error sending OTP:', error.message);
    alert('Failed to send OTP: ' + error.message);
  }
}

// 2. Verify the OTP
async function verifyOTP() {
  const otpToken = document.getElementById('otp-input').value;

  try {
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      phone: currentPhoneNumber,
      token: otpToken,
      type: 'sms' // Important for phone OTP
    });

    if (error) throw error;

    alert('Login Successful!');
    console.log('User Session:', session);
    
    // Supabase automatically saves the session in localStorage.
    // Redirect to the dashboard or home page
    window.location.href = '/modules/index.html';

  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    alert('Invalid OTP: ' + error.message);
  }
}

// 3. Check if user is already logged in
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // User is logged in, redirect them
    window.location.href = '/modules/index.html';
  }
}

// Run session check on page load
checkSession();
```

---

## Best Practices for Global Deployments
1. **Always use E.164 Formatting:** Supabase requires phone numbers to be in E.164 format (e.g., `+2348012345678`). Never send local formats (`08012345678`) to the API. Our JavaScript explicitly handles removing the leading zero.
2. **Library Recommendation:** For a production-ready country dropdown, use the [intl-tel-input](https://github.com/jackocnr/intl-tel-input) library instead of a hardcoded `<select>`. It automatically handles country flags, dial codes, and validates E.164 formatting before you send it to Supabase.
3. **Fallback to Email:** SMS deliverability can vary globally and can be expensive. It is highly recommended to offer Email OTP as a fallback option if a user doesn't receive the SMS. The code is identical, just swap `{ phone: '...' }` for `{ email: '...' }` and set the type to `'email'` in `verifyOtp`.
