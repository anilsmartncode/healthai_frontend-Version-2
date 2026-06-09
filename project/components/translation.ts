export type LangCode = 'en' | 'hi' | 'te' | 'ta' | 'kn';

export type TranslationKeys = {
  // Onboarding
  onboard_title: string;
  onboard_sub: string;
  feat1: string;
  feat2: string;
  feat3: string;
  feat4: string;
  get_started: string;
  have_account: string;
  login: string;
  // Language
  choose_lang: string;
  choose_lang_sub: string;
  continue: string;
  // Login
  login_title: string;
  login_sub: string;
  mobile_number: string;
  send_otp: string;
  or_continue: string;
  google_signin: string;
  guest_signin: string;
  terms_text: string;
  terms_link: string;
  and: string;
  privacy_link: string;
  // OTP
  verify_otp: string;
  otp_sub: string;
  resend_in: string;
  verify_btn: string;
  ssl: string;
  hipaa: string;
  privacy: string;
  priority: string;
  // Home
  good_morning: string;
  good: string;
  health_score_title: string;
  health_score_desc: string;
  quick_actions: string;
  upload_report: string;
  interactions: string;
  care_hub: string;
  ask_ai: string;
  recent_reports: string;
  view_all: string;
  thyroid_report: string;
  blood_report: string;
  attention: string;
  normal: string;
  // Nav
  nav_home: string;
  nav_reports: string;
  nav_ai: string;
  nav_profile: string;
  // Reports
  my_reports: string;
  upload: string;
  // Analysis
  good_health: string;
  analysis_sub: string;
  key_findings: string;
  ai_explanation: string;
  see_all_values: string;
  discuss_ai: string;
  all_values: string;
  all_values_sub: string;
  // AI
  ai_greeting: string;
  ai_placeholder: string;
  ai_reply: string;
  suggested: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  // Profile
  profile: string;
  log_out: string;
  account: string;
  notifications: string;
  // Account
  account_info: string;
  full_name: string;
  email: string;
  phone: string;
  save_changes: string;
  // Medicines
  interactions_title: string;
  interactions_sub: string;
  selected_meds: string;
  add_medicine: string;
  search_medicine: string;
  save_check: string;
  moderate_interaction: string;
  // Care Hub
  care_hub_title: string;
  family: string;
  medications: string;
  trends: string;
  // Notifications
  notif_title: string;
};

export const translations: Record<LangCode, TranslationKeys> = {
  en: {
    onboard_title: 'Your AI Health Companion',
    onboard_sub: 'Understand. Act. Stay Healthy.',
    feat1: 'Understand reports in simple language',
    feat2: 'Track your health over time',
    feat3: 'Get AI-powered recommendations',
    feat4: 'Manage medicines & family',
    get_started: 'Get Started',
    have_account: 'Already have an account?',
    login: 'Login',
    choose_lang: 'Choose Language',
    choose_lang_sub: 'Select your preferred language',
    continue: 'Continue',
    login_title: 'Login / Sign up',
    login_sub: 'Welcome back! Please login to continue',
    mobile_number: 'Mobile Number',
    send_otp: 'Send OTP',
    or_continue: 'or continue with',
    google_signin: 'Continue with Google',
    guest_signin: 'Continue as Guest',
    terms_text: 'By continuing, you agree to our',
    terms_link: 'Terms & Conditions',
    and: 'and',
    privacy_link: 'Privacy Policy',
    verify_otp: 'Verify OTP',
    otp_sub: 'Enter the 6-digit code sent to',
    resend_in: 'Resend OTP in',
    verify_btn: 'Verify & Continue',
    ssl: 'SSL Secured',
    hipaa: 'HIPAA Compliant',
    privacy: 'Your Privacy',
    priority: 'Our Priority',
    good_morning: 'Good morning,',
    good: 'Good',
    health_score_title: 'Your Health Score',
    health_score_desc: '2 values need attention',
    quick_actions: 'Quick Actions',
    upload_report: 'Upload Report',
    interactions: 'Check Interactions',
    care_hub: 'Care Hub',
    ask_ai: 'Ask AI',
    recent_reports: 'Recent Reports',
    view_all: 'View all',
    thyroid_report: 'Thyroid Profile',
    blood_report: 'Complete Blood Count',
    attention: 'Attention',
    normal: 'Normal',
    nav_home: 'Home',
    nav_reports: 'Reports',
    nav_ai: 'AI',
    nav_profile: 'Profile',
    my_reports: 'My Reports',
    upload: 'Upload',
    good_health: 'Good Health',
    analysis_sub: 'Your report looks good overall. 2 values need attention.',
    key_findings: 'Key Findings',
    ai_explanation: 'AI Explanation',
    see_all_values: 'See All Values',
    discuss_ai: 'Discuss with AI Assistant',
    all_values: 'All Values',
    all_values_sub: 'See all test values in detail',
    ai_greeting: "Hi! I'm your AI health assistant. Ask me anything about your reports or medications.",
    ai_placeholder: 'Ask about your health…',
    ai_reply: "I'm reviewing your health data. Please consult your doctor for personalized advice.",
    suggested: 'Suggested questions',
    q1: 'What does my TSH result mean?',
    q2: 'Is my cholesterol level dangerous?',
    q3: 'What foods should I avoid?',
    q4: 'When should I see a doctor?',
    profile: 'Profile',
    log_out: 'Log Out',
    account: 'Account',
    notifications: 'Notifications',
    account_info: 'Account Information',
    full_name: 'Full name',
    email: 'Email',
    phone: 'Phone',
    save_changes: 'Save Changes',
    interactions_title: 'Interactions Checker',
    interactions_sub: 'Check for medicine interactions',
    selected_meds: 'Selected Medicines',
    add_medicine: 'Add Another Medicine',
    search_medicine: 'Search medicine',
    save_check: 'Save This Check',
    moderate_interaction: 'Moderate Interaction Found',
    care_hub_title: 'Care Hub',
    family: 'Family',
    medications: 'Medications',
    trends: 'Trends',
    notif_title: 'Notifications',
  },

  hi: {
    onboard_title: 'आपका AI स्वास्थ्य साथी',
    onboard_sub: 'समझें। कार्य करें। स्वस्थ रहें।',
    feat1: 'रिपोर्ट को सरल भाषा में समझें',
    feat2: 'अपने स्वास्थ्य को ट्रैक करें',
    feat3: 'AI सुझाव प्राप्त करें',
    feat4: 'दवाइयां और परिवार प्रबंधित करें',
    get_started: 'शुरू करें',
    have_account: 'पहले से खाता है?',
    login: 'लॉगिन करें',
    choose_lang: 'भाषा चुनें',
    choose_lang_sub: 'अपनी पसंदीदा भाषा चुनें',
    continue: 'जारी रखें',
    login_title: 'लॉगिन / साइन अप',
    login_sub: 'वापस आपका स्वागत है! जारी रखने के लिए लॉगिन करें',
    mobile_number: 'मोबाइल नंबर',
    send_otp: 'OTP भेजें',
    or_continue: 'या इससे जारी रखें',
    google_signin: 'Google से जारी रखें',
    guest_signin: 'अतिथि के रूप में जारी रखें',
    terms_text: 'जारी रखने पर आप हमारी',
    terms_link: 'नियम और शर्तें',
    and: 'और',
    privacy_link: 'गोपनीयता नीति',
    verify_otp: 'OTP सत्यापित करें',
    otp_sub: 'इस नंबर पर भेजा गया 6-अंकीय कोड दर्ज करें',
    resend_in: 'OTP पुनः भेजें',
    verify_btn: 'सत्यापित करें और जारी रखें',
    ssl: 'SSL सुरक्षित',
    hipaa: 'HIPAA अनुपालन',
    privacy: 'आपकी गोपनीयता',
    priority: 'हमारी प्राथमिकता',
    good_morning: 'सुप्रभात,',
    good: 'अच्छा',
    health_score_title: 'आपका स्वास्थ्य स्कोर',
    health_score_desc: '2 मूल्यों पर ध्यान चाहिए',
    quick_actions: 'त्वरित कार्य',
    upload_report: 'रिपोर्ट अपलोड करें',
    interactions: 'इंटरेक्शन जांचें',
    care_hub: 'केयर हब',
    ask_ai: 'AI से पूछें',
    recent_reports: 'हाल की रिपोर्टें',
    view_all: 'सभी देखें',
    thyroid_report: 'थायरॉइड प्रोफाइल',
    blood_report: 'पूर्ण रक्त गणना',
    attention: 'ध्यान दें',
    normal: 'सामान्य',
    nav_home: 'होम',
    nav_reports: 'रिपोर्ट',
    nav_ai: 'AI',
    nav_profile: 'प्रोफ़ाइल',
    my_reports: 'मेरी रिपोर्टें',
    upload: 'अपलोड',
    good_health: 'अच्छा स्वास्थ्य',
    analysis_sub: 'आपकी रिपोर्ट कुल मिलाकर अच्छी है। 2 मूल्यों पर ध्यान चाहिए।',
    key_findings: 'मुख्य निष्कर्ष',
    ai_explanation: 'AI व्याख्या',
    see_all_values: 'सभी मूल्य देखें',
    discuss_ai: 'AI सहायक से चर्चा करें',
    all_values: 'सभी मूल्य',
    all_values_sub: 'सभी परीक्षण मूल्य विस्तार से देखें',
    ai_greeting: 'नमस्ते! मैं आपका AI स्वास्थ्य सहायक हूं। अपनी रिपोर्ट या दवाइयों के बारे में कुछ भी पूछें।',
    ai_placeholder: 'अपने स्वास्थ्य के बारे में पूछें…',
    ai_reply: 'मैं आपका स्वास्थ्य डेटा देख रहा हूं। व्यक्तिगत सलाह के लिए अपने डॉक्टर से परामर्श करें।',
    suggested: 'सुझाए गए प्रश्न',
    q1: 'मेरे TSH परिणाम का क्या मतलब है?',
    q2: 'क्या मेरा कोलेस्ट्रॉल स्तर खतरनाक है?',
    q3: 'मुझे क्या खाद्य पदार्थ नहीं खाने चाहिए?',
    q4: 'मुझे डॉक्टर से कब मिलना चाहिए?',
    profile: 'प्रोफ़ाइल',
    log_out: 'लॉग आउट',
    account: 'खाता',
    notifications: 'सूचनाएं',
    account_info: 'खाता जानकारी',
    full_name: 'पूरा नाम',
    email: 'ईमेल',
    phone: 'फोन',
    save_changes: 'परिवर्तन सहेजें',
    interactions_title: 'इंटरेक्शन जांचकर्ता',
    interactions_sub: 'दवाई इंटरेक्शन जांचें',
    selected_meds: 'चयनित दवाइयां',
    add_medicine: 'और दवाई जोड़ें',
    search_medicine: 'दवाई खोजें',
    save_check: 'यह जांच सहेजें',
    moderate_interaction: 'मध्यम इंटरेक्शन मिला',
    care_hub_title: 'केयर हब',
    family: 'परिवार',
    medications: 'दवाइयां',
    trends: 'रुझान',
    notif_title: 'सूचनाएं',
  },

  te: {
    onboard_title: 'మీ AI ఆరోగ్య సహాయకుడు',
    onboard_sub: 'అర్థం చేసుకోండి. చర్య తీసుకోండి. ఆరోగ్యంగా ఉండండి.',
    feat1: 'నివేదికలను సులభ భాషలో అర్థం చేసుకోండి',
    feat2: 'మీ ఆరోగ్యాన్ని ట్రాక్ చేయండి',
    feat3: 'AI సిఫార్సులు పొందండి',
    feat4: 'మందులు & కుటుంబాన్ని నిర్వహించండి',
    get_started: 'ప్రారంభించండి',
    have_account: 'ఇప్పటికే ఖాతా ఉందా?',
    login: 'లాగిన్',
    choose_lang: 'భాష ఎంచుకోండి',
    choose_lang_sub: 'మీకు నచ్చిన భాషను ఎంచుకోండి',
    continue: 'కొనసాగించు',
    login_title: 'లాగిన్ / సైన్ అప్',
    login_sub: 'తిరిగి స్వాగతం! కొనసాగించడానికి లాగిన్ చేయండి',
    mobile_number: 'మొబైల్ నంబర్',
    send_otp: 'OTP పంపండి',
    or_continue: 'లేదా దీనితో కొనసాగించండి',
    google_signin: 'Googleతో కొనసాగించండి',
    guest_signin: 'అతిథిగా కొనసాగించండి',
    terms_text: 'కొనసాగించడం ద్వారా మీరు మా',
    terms_link: 'నిబంధనలు & షరతులు',
    and: 'మరియు',
    privacy_link: 'గోప్యతా విధానం',
    verify_otp: 'OTP ధృవీకరించండి',
    otp_sub: 'పంపిన 6-అంకెల కోడ్ నమోదు చేయండి',
    resend_in: 'OTP మళ్ళీ పంపండి',
    verify_btn: 'ధృవీకరించండి & కొనసాగించండి',
    ssl: 'SSL భద్రత',
    hipaa: 'HIPAA సమ్మతి',
    privacy: 'మీ గోప్యత',
    priority: 'మా ఆద్యత',
    good_morning: 'శుభోదయం,',
    good: 'మంచిది',
    health_score_title: 'మీ ఆరోగ్య స్కోర్',
    health_score_desc: '2 విలువలకు శ్రద్ధ అవసరం',
    quick_actions: 'త్వరిత చర్యలు',
    upload_report: 'నివేదిక అప్‌లోడ్ చేయండి',
    interactions: 'ఇంటరాక్షన్స్ తనిఖీ చేయండి',
    care_hub: 'కేర్ హబ్',
    ask_ai: 'AI అడగండి',
    recent_reports: 'ఇటీవలి నివేదికలు',
    view_all: 'అన్నీ చూడండి',
    thyroid_report: 'థైరాయిడ్ ప్రొఫైల్',
    blood_report: 'సంపూర్ణ రక్త పరీక్ష',
    attention: 'శ్రద్ధ అవసరం',
    normal: 'సాధారణం',
    nav_home: 'హోమ్',
    nav_reports: 'నివేదికలు',
    nav_ai: 'AI',
    nav_profile: 'ప్రొఫైల్',
    my_reports: 'నా నివేదికలు',
    upload: 'అప్‌లోడ్',
    good_health: 'మంచి ఆరోగ్యం',
    analysis_sub: 'మీ నివేదిక మొత్తంగా బాగుంది. 2 విలువలకు శ్రద్ధ అవసరం.',
    key_findings: 'ముఖ్య నిర్ధారణలు',
    ai_explanation: 'AI వివరణ',
    see_all_values: 'అన్ని విలువలు చూడండి',
    discuss_ai: 'AI సహాయకుడితో చర్చించండి',
    all_values: 'అన్ని విలువలు',
    all_values_sub: 'అన్ని పరీక్షా విలువలు వివరంగా చూడండి',
    ai_greeting: 'నమస్కారం! నేను మీ AI ఆరోగ్య సహాయకుడిని. మీ నివేదికలు లేదా మందుల గురించి ఏదైనా అడగండి.',
    ai_placeholder: 'మీ ఆరోగ్యం గురించి అడగండి…',
    ai_reply: 'నేను మీ ఆరోగ్య డేటాను సమీక్షిస్తున్నాను. వ్యక్తిగత సలహా కోసం మీ డాక్టర్‌ను సంప్రదించండి.',
    suggested: 'సూచించిన ప్రశ్నలు',
    q1: 'నా TSH ఫలితం అంటే ఏమిటి?',
    q2: 'నా కొలెస్ట్రాల్ స్థాయి ప్రమాదకరంగా ఉందా?',
    q3: 'నేను ఏ ఆహారాలు నివారించాలి?',
    q4: 'నేను డాక్టర్‌ని ఎప్పుడు చూడాలి?',
    profile: 'ప్రొఫైల్',
    log_out: 'లాగ్ అవుట్',
    account: 'ఖాతా',
    notifications: 'నోటిఫికేషన్లు',
    account_info: 'ఖాతా సమాచారం',
    full_name: 'పూర్తి పేరు',
    email: 'ఇమెయిల్',
    phone: 'ఫోన్',
    save_changes: 'మార్పులు సేవ్ చేయండి',
    interactions_title: 'ఇంటరాక్షన్స్ చెకర్',
    interactions_sub: 'మందుల ఇంటరాక్షన్లను తనిఖీ చేయండి',
    selected_meds: 'ఎంచుకున్న మందులు',
    add_medicine: 'మరో మందు జోడించండి',
    search_medicine: 'మందు వెతకండి',
    save_check: 'ఈ తనిఖీ సేవ్ చేయండి',
    moderate_interaction: 'మధ్యస్థ ఇంటరాక్షన్ కనుగొనబడింది',
    care_hub_title: 'కేర్ హబ్',
    family: 'కుటుంబం',
    medications: 'మందులు',
    trends: 'ట్రెండ్స్',
    notif_title: 'నోటిఫికేషన్లు',
  },

  ta: {
    onboard_title: 'உங்கள் AI சுகாதார உதவியாளர்',
    onboard_sub: 'புரிந்துகொள்ளுங்கள். செயல்படுங்கள். ஆரோக்கியமாக இருங்கள்.',
    feat1: 'அறிக்கைகளை எளிய மொழியில் புரிந்துகொள்ளுங்கள்',
    feat2: 'உங்கள் உடல்நலனை கண்காணிக்கவும்',
    feat3: 'AI பரிந்துரைகளைப் பெறுங்கள்',
    feat4: 'மருந்துகள் & குடும்பத்தை நிர்வகிக்கவும்',
    get_started: 'தொடங்குங்கள்',
    have_account: 'ஏற்கனவே கணக்கு இருக்கிறதா?',
    login: 'உள்நுழைக',
    choose_lang: 'மொழியை தேர்வுசெய்க',
    choose_lang_sub: 'உங்கள் விருப்பமான மொழியை தேர்வுசெய்க',
    continue: 'தொடரவும்',
    login_title: 'உள்நுழைவு / பதிவு',
    login_sub: 'மீண்டும் வரவேற்கிறோம்! தொடர உள்நுழையவும்',
    mobile_number: 'மொபைல் எண்',
    send_otp: 'OTP அனுப்பு',
    or_continue: 'அல்லது இதனுடன் தொடரவும்',
    google_signin: 'Google உடன் தொடரவும்',
    guest_signin: 'விருந்தினராக தொடரவும்',
    terms_text: 'தொடர்வதன் மூலம் நீங்கள் எங்கள்',
    terms_link: 'விதிமுறைகள் & நிபந்தனைகள்',
    and: 'மற்றும்',
    privacy_link: 'தனியுரிமைக் கொள்கை',
    verify_otp: 'OTP சரிபார்க்கவும்',
    otp_sub: 'அனுப்பிய 6-இலக்க குறியீட்டை உள்ளிடவும்',
    resend_in: 'OTP மீண்டும் அனுப்பவும்',
    verify_btn: 'சரிபார்த்து தொடரவும்',
    ssl: 'SSL பாதுகாப்பு',
    hipaa: 'HIPAA இணக்கம்',
    privacy: 'உங்கள் தனியுரிமை',
    priority: 'எங்கள் முன்னுரிமை',
    good_morning: 'காலை வணக்கம்,',
    good: 'நல்லது',
    health_score_title: 'உங்கள் உடல்நல மதிப்பெண்',
    health_score_desc: '2 மதிப்புகளுக்கு கவனம் தேவை',
    quick_actions: 'விரைவு செயல்கள்',
    upload_report: 'அறிக்கை பதிவேற்றவும்',
    interactions: 'தொடர்புகளை சரிபார்க்கவும்',
    care_hub: 'கேர் ஹப்',
    ask_ai: 'AI கேளுங்கள்',
    recent_reports: 'சமீபத்திய அறிக்கைகள்',
    view_all: 'அனைத்தும் பார்க்க',
    thyroid_report: 'தைராய்டு சுயவிவரம்',
    blood_report: 'முழு இரத்த எண்ணிக்கை',
    attention: 'கவனம் தேவை',
    normal: 'சாதாரண',
    nav_home: 'முகப்பு',
    nav_reports: 'அறிக்கைகள்',
    nav_ai: 'AI',
    nav_profile: 'சுயவிவரம்',
    my_reports: 'என் அறிக்கைகள்',
    upload: 'பதிவேற்று',
    good_health: 'நல்ல உடல்நலம்',
    analysis_sub: 'உங்கள் அறிக்கை ஒட்டுமொத்தமாக நல்லது. 2 மதிப்புகளுக்கு கவனம் தேவை.',
    key_findings: 'முக்கிய கண்டுபிடிப்புகள்',
    ai_explanation: 'AI விளக்கம்',
    see_all_values: 'அனைத்து மதிப்புகளையும் காண்க',
    discuss_ai: 'AI உதவியாளருடன் விவாதிக்கவும்',
    all_values: 'அனைத்து மதிப்புகள்',
    all_values_sub: 'அனைத்து சோதனை மதிப்புகளையும் விரிவாகக் காண்க',
    ai_greeting: 'வணக்கம்! நான் உங்கள் AI சுகாதார உதவியாளர். உங்கள் அறிக்கைகள் அல்லது மருந்துகள் பற்றி எதையும் கேளுங்கள்.',
    ai_placeholder: 'உங்கள் உடல்நலம் பற்றி கேளுங்கள்…',
    ai_reply: 'நான் உங்கள் சுகாதார தரவை மதிப்பாய்வு செய்கிறேன். தனிப்பட்ட ஆலோசனைக்கு உங்கள் மருத்துவரை அணுகவும்.',
    suggested: 'பரிந்துரைக்கப்பட்ட கேள்விகள்',
    q1: 'என் TSH முடிவு என்ன அர்த்தம்?',
    q2: 'என் கொலஸ்ட்ரால் அளவு ஆபத்தானதா?',
    q3: 'நான் என்ன உணவுகளை தவிர்க்க வேண்டும்?',
    q4: 'நான் எப்போது மருத்துவரை சந்திக்க வேண்டும்?',
    profile: 'சுயவிவரம்',
    log_out: 'வெளியேறு',
    account: 'கணக்கு',
    notifications: 'அறிவிப்புகள்',
    account_info: 'கணக்கு தகவல்',
    full_name: 'முழு பெயர்',
    email: 'மின்னஞ்சல்',
    phone: 'தொலைபேசி',
    save_changes: 'மாற்றங்களை சேமிக்கவும்',
    interactions_title: 'தொடர்பு சரிபார்ப்பு',
    interactions_sub: 'மருந்து தொடர்புகளை சரிபார்க்கவும்',
    selected_meds: 'தேர்ந்தெடுக்கப்பட்ட மருந்துகள்',
    add_medicine: 'மற்றொரு மருந்து சேர்க்கவும்',
    search_medicine: 'மருந்து தேடவும்',
    save_check: 'இந்த சரிபார்ப்பை சேமிக்கவும்',
    moderate_interaction: 'மிதமான தொடர்பு கண்டறியப்பட்டது',
    care_hub_title: 'கேர் ஹப்',
    family: 'குடும்பம்',
    medications: 'மருந்துகள்',
    trends: 'போக்குகள்',
    notif_title: 'அறிவிப்புகள்',
  },

  kn: {
    onboard_title: 'ನಿಮ್ಮ AI ಆರೋಗ್ಯ ಸಹಾಯಕ',
    onboard_sub: 'ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ. ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳಿ. ಆರೋಗ್ಯವಾಗಿರಿ.',
    feat1: 'ವರದಿಗಳನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ',
    feat2: 'ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    feat3: 'AI ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಿರಿ',
    feat4: 'ಔಷಧಿಗಳು ಮತ್ತು ಕುಟುಂಬವನ್ನು ನಿರ್ವಹಿಸಿ',
    get_started: 'ಪ್ರಾರಂಭಿಸಿ',
    have_account: 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
    login: 'ಲಾಗಿನ್',
    choose_lang: 'ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ',
    choose_lang_sub: 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ',
    continue: 'ಮುಂದುವರಿಸಿ',
    login_title: 'ಲಾಗಿನ್ / ಸೈನ್ ಅಪ್',
    login_sub: 'ಮತ್ತೆ ಸ್ವಾಗತ! ಮುಂದುವರಿಸಲು ಲಾಗಿನ್ ಮಾಡಿ',
    mobile_number: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    send_otp: 'OTP ಕಳುಹಿಸಿ',
    or_continue: 'ಅಥವಾ ಇದರೊಂದಿಗೆ ಮುಂದುವರಿಸಿ',
    google_signin: 'Google ನೊಂದಿಗೆ ಮುಂದುವರಿಸಿ',
    guest_signin: 'ಅತಿಥಿಯಾಗಿ ಮುಂದುವರಿಸಿ',
    terms_text: 'ಮುಂದುವರಿಯುವ ಮೂಲಕ ನೀವು ನಮ್ಮ',
    terms_link: 'ನಿಯಮಗಳು & ಷರತ್ತುಗಳು',
    and: 'ಮತ್ತು',
    privacy_link: 'ಗೌಪ್ಯತಾ ನೀತಿ',
    verify_otp: 'OTP ಪರಿಶೀಲಿಸಿ',
    otp_sub: 'ಕಳುಹಿಸಿದ 6-ಅಂಕಿ ಕೋಡ್ ನಮೂದಿಸಿ',
    resend_in: 'OTP ಮರು-ಕಳುಹಿಸಿ',
    verify_btn: 'ಪರಿಶೀಲಿಸಿ & ಮುಂದುವರಿಸಿ',
    ssl: 'SSL ಭದ್ರತೆ',
    hipaa: 'HIPAA ಅನುಸರಣೆ',
    privacy: 'ನಿಮ್ಮ ಗೌಪ್ಯತೆ',
    priority: 'ನಮ್ಮ ಆದ್ಯತೆ',
    good_morning: 'ಶುಭೋದಯ,',
    good: 'ಒಳ್ಳೆಯದು',
    health_score_title: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಸ್ಕೋರ್',
    health_score_desc: '2 ಮೌಲ್ಯಗಳಿಗೆ ಗಮನ ಅಗತ್ಯ',
    quick_actions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
    upload_report: 'ವರದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    interactions: 'ಇಂಟರಾಕ್ಷನ್ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
    care_hub: 'ಕೇರ್ ಹಬ್',
    ask_ai: 'AI ಕೇಳಿ',
    recent_reports: 'ಇತ್ತೀಚಿನ ವರದಿಗಳು',
    view_all: 'ಎಲ್ಲಾ ನೋಡಿ',
    thyroid_report: 'ಥೈರಾಯ್ಡ್ ಪ್ರೊಫೈಲ್',
    blood_report: 'ಸಂಪೂರ್ಣ ರಕ್ತ ಗಣನೆ',
    attention: 'ಗಮನ ಅಗತ್ಯ',
    normal: 'ಸಾಮಾನ್ಯ',
    nav_home: 'ಮುಖ್ಯ',
    nav_reports: 'ವರದಿಗಳು',
    nav_ai: 'AI',
    nav_profile: 'ಪ್ರೊಫೈಲ್',
    my_reports: 'ನನ್ನ ವರದಿಗಳು',
    upload: 'ಅಪ್‌ಲೋಡ್',
    good_health: 'ಉತ್ತಮ ಆರೋಗ್ಯ',
    analysis_sub: 'ನಿಮ್ಮ ವರದಿ ಒಟ್ಟಾರೆ ಉತ್ತಮವಾಗಿದೆ. 2 ಮೌಲ್ಯಗಳಿಗೆ ಗಮನ ಅಗತ್ಯ.',
    key_findings: 'ಪ್ರಮುಖ ಸಂಶೋಧನೆಗಳು',
    ai_explanation: 'AI ವಿವರಣೆ',
    see_all_values: 'ಎಲ್ಲಾ ಮೌಲ್ಯಗಳನ್ನು ನೋಡಿ',
    discuss_ai: 'AI ಸಹಾಯಕರೊಂದಿಗೆ ಚರ್ಚಿಸಿ',
    all_values: 'ಎಲ್ಲಾ ಮೌಲ್ಯಗಳು',
    all_values_sub: 'ಎಲ್ಲಾ ಪರೀಕ್ಷಾ ಮೌಲ್ಯಗಳನ್ನು ವಿವರವಾಗಿ ನೋಡಿ',
    ai_greeting: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮ್ಮ ವರದಿಗಳು ಅಥವಾ ಔಷಧಿಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ.',
    ai_placeholder: 'ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಕೇಳಿ…',
    ai_reply: 'ನಾನು ನಿಮ್ಮ ಆರೋಗ್ಯ ಡೇಟಾವನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇನೆ. ವ್ಯಕ್ತಿಗತ ಸಲಹೆಗಾಗಿ ನಿಮ್ಮ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    suggested: 'ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು',
    q1: 'ನನ್ನ TSH ಫಲಿತಾಂಶ ಏನು ಅರ್ಥ?',
    q2: 'ನನ್ನ ಕೊಲೆಸ್ಟ್ರಾಲ್ ಮಟ್ಟ ಅಪಾಯಕಾರಿಯೇ?',
    q3: 'ನಾನು ಯಾವ ಆಹಾರಗಳನ್ನು ತಪ್ಪಿಸಬೇಕು?',
    q4: 'ನಾನು ಡಾಕ್ಟರ್ ಅನ್ನು ಯಾವಾಗ ನೋಡಬೇಕು?',
    profile: 'ಪ್ರೊಫೈಲ್',
    log_out: 'ಲಾಗ್ ಔಟ್',
    account: 'ಖಾತೆ',
    notifications: 'ಅಧಿಸೂಚನೆಗಳು',
    account_info: 'ಖಾತೆ ಮಾಹಿತಿ',
    full_name: 'ಪೂರ್ಣ ಹೆಸರು',
    email: 'ಇಮೇಲ್',
    phone: 'ಫೋನ್',
    save_changes: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    interactions_title: 'ಇಂಟರಾಕ್ಷನ್ ಪರಿಶೀಲಕ',
    interactions_sub: 'ಔಷಧಿ ಇಂಟರಾಕ್ಷನ್ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
    selected_meds: 'ಆಯ್ಕೆ ಮಾಡಿದ ಔಷಧಿಗಳು',
    add_medicine: 'ಮತ್ತೊಂದು ಔಷಧಿ ಸೇರಿಸಿ',
    search_medicine: 'ಔಷಧಿ ಹುಡುಕಿ',
    save_check: 'ಈ ಪರಿಶೀಲನೆ ಉಳಿಸಿ',
    moderate_interaction: 'ಮಧ್ಯಮ ಇಂಟರಾಕ್ಷನ್ ಕಂಡುಬಂದಿದೆ',
    care_hub_title: 'ಕೇರ್ ಹಬ್',
    family: 'ಕುಟುಂಬ',
    medications: 'ಔಷಧಿಗಳು',
    trends: 'ಟ್ರೆಂಡ್ಸ್',
    notif_title: 'ಅಧಿಸೂಚನೆಗಳು',
  },
};