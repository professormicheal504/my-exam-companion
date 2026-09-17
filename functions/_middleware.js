export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Redirect *.pages.dev traffic to the canonical domain to prevent duplicate content
  if (url.hostname.endsWith('.pages.dev')) {
    const canonical = 'https://myexamcompanion.com' + path + url.search;
    return Response.redirect(canonical, 301);
  }

  const exactRoutes = {
  "/": "/modules/",
  "/ng": "/modules/",
  "/ng/": "/modules/",
  "/gh": "/modules/",
  "/gh/": "/modules/",
  "/us": "/modules/",
  "/us/": "/modules/",
  "/ng/study/past-questions": "/modules/study/study_past_questions/study_subject",
  "/ng/study/novel": "/modules/study/novel/novel",
  "/ng/study/syllabus": "/modules/study/syllabus/syllabus",
  "/ng/study/brochure": "/modules/study/brochure/brochure",
  "/ng/study/videos": "/modules/study/topic_video/topic_video",
  "/ng/study/scholarships": "/modules/study/scholarship/list_of_scholarship",
  "/gh/study/past-questions": "/modules/study/study_past_questions/study_subject",
  "/gh/study/videos": "/modules/study/topic_video/topic_video",
  "/us/study/past-questions": "/modules/study/study_past_questions/study_subject",
  "/ng/test": "/modules/cbt_test/core/setup",
  "/ng/test/result": "/modules/cbt_test/core/result",
  "/ng/test/analysis": "/modules/cbt_test/core/deep_analysis",
  "/ng/test/jamb-mock": "/modules/cbt_test/jamb_mock_exam/mock_date_and_point",
  "/ng/test/live-arena": "/modules/cbt_test/live_quiz_arena/exam_body",
  "/ng/test/live-arena/instruction": "/modules/cbt_test/live_quiz_arena/instruction",
  "/ng/test/secondary": "/modules/cbt_test/secondary_school/all_classes",
  "/ng/test/post-utme": "/modules/cbt_test/core/university_exam_post_utme",
  "/ng/test/university": "/modules/cbt_test/university_exam/university_exam",
  "/ng/test/instruction": "/modules/cbt_test/core/instruction",
  "/ng/test/premium": "/modules/cbt_test/core/setup_premium",
  "/gh/test": "/modules/cbt_test/core/setup",
  "/gh/test/premium": "/modules/cbt_test/core/setup_premium",
  "/gh/test/result": "/modules/cbt_test/core/result",
  "/gh/test/instruction": "/modules/cbt_test/core/instruction",
  "/gh/test/live-arena/instruction": "/modules/cbt_test/live_quiz_arena/instruction",
  "/us/test": "/modules/cbt_test/core/setup",
  "/us/test/premium": "/modules/cbt_test/core/setup_premium",
  "/us/test/result": "/modules/cbt_test/core/result",
  "/us/test/instruction": "/modules/cbt_test/core/instruction",
  "/us/test/live-arena/instruction": "/modules/cbt_test/live_quiz_arena/instruction",
  "/ng/blog": "/modules/blog/categories",
  "/gh/blog": "/modules/blog/categories",
  "/us/blog": "/modules/blog/categories",
  "/ng/rank": "/modules/rank/rank",
  "/ng/earnings": "/modules/earnings/earnings",
  "/ng/task": "/modules/task/task",
  "/ng/referral": "/modules/referrals/referrals",
  "/ng/ai-tutor": "/modules/cbt_test/core/ai_plan",
  "/ng/pricing": "/modules/pricing/pricing",
  "/ng/chat": "/modules/chat/admin_list",
  "/ng/history": "/modules/history/history",
  "/gh/rank": "/modules/rank/rank",
  "/gh/ai-tutor": "/modules/cbt_test/core/ai_plan",
  "/gh/pricing": "/modules/pricing/pricing",
  "/us/rank": "/modules/rank/rank",
  "/us/ai-tutor": "/modules/cbt_test/core/ai_plan",
  "/us/pricing": "/modules/pricing/pricing",
  "/top-up": "/modules/top_up/wallet_dashboard",
  "/top-up/add": "/modules/top_up/amount_entry",
  "/top-up/checkout": "/modules/top_up/paystack_inline_checkout",
  "/login": "/modules/auth/login",
  "/signup": "/modules/auth/sign_up",
  "/verify": "/modules/auth/otp",
  "/onboarding": "/modules/auth/fill_form",
  "/ng/landing/jamb": "/modules/landing/nigeria-jamb",
  "/ng/landing/waec": "/modules/landing/nigeria-waec",
  "/ng/landing/neco": "/modules/landing/nigeria-neco",
  "/ng/landing/uniben-post-utme": "/modules/landing/nigeria-uniben-post-utme",
  "/ng/landing/southern-delta-university": "/modules/landing/nigeria-southern-delta-university",
  "/gh/landing/waec": "/modules/landing/ghana-waec",
  "/us/landing/sat": "/modules/landing/usa-sat",
  "/ng/about-us": "/modules/footer/about_us",
  "/ng/contact-us": "/modules/footer/contact_us",
  "/ng/privacy-policy": "/modules/footer/privacy_policy",
  "/ng/terms-of-service": "/modules/footer/terms_of_service",
  "/ng/disclaimer": "/modules/footer/disclaimer",
  "/gh/about-us": "/modules/footer/about_us",
  "/gh/contact-us": "/modules/footer/contact_us",
  "/gh/privacy-policy": "/modules/footer/privacy_policy",
  "/gh/terms-of-service": "/modules/footer/terms_of_service",
  "/gh/disclaimer": "/modules/footer/disclaimer",
  "/us/about-us": "/modules/footer/about_us",
  "/us/contact-us": "/modules/footer/contact_us",
  "/us/privacy-policy": "/modules/footer/privacy_policy",
  "/us/terms-of-service": "/modules/footer/terms_of_service",
  "/us/disclaimer": "/modules/footer/disclaimer"
};
  const prefixRoutes = {
  "/ng/study/past-questions/": "/modules/study/study_past_questions/study_explanation",
  "/gh/study/past-questions/": "/modules/study/study_past_questions/study_explanation",
  "/us/study/past-questions/": "/modules/study/study_past_questions/study_explanation",
  "/ng/test/": "/modules/cbt_test/core/cbt_player",
  "/gh/test/": "/modules/cbt_test/core/cbt_player",
  "/us/test/": "/modules/cbt_test/core/cbt_player",
  "/ng/blog/": "/modules/blog/content",
  "/gh/blog/": "/modules/blog/content",
  "/us/blog/": "/modules/blog/content"
};

  if (exactRoutes[path]) {
    return context.env.ASSETS.fetch(new Request(new URL(exactRoutes[path], context.request.url).toString(), context.request));
  }

  for (const [prefix, dest] of Object.entries(prefixRoutes)) {
    if (path.startsWith(prefix)) {
      return context.env.ASSETS.fetch(new Request(new URL(dest, context.request.url).toString(), context.request));
    }
  }

  return context.next();
}
