import { onRequest as __modules_study_classroom_classroom_discussion_html_js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\modules\\study\\classroom\\classroom_discussion.html.js"
import { onRequest as __modules_study_classroom_classroom_questions_html_js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\modules\\study\\classroom\\classroom_questions.html.js"
import { onRequest as ____country___study_brochure___slug___js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\[[country]]\\study\\brochure\\[[slug]].js"
import { onRequest as ____country___study_classroom___path___js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\[[country]]\\study\\classroom\\[[path]].js"
import { onRequest as ____country___blog___path___js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\[[country]]\\blog\\[[path]].js"
import { onRequestGet as __api_poll_js_onRequestGet } from "C:\\myproject\\my_exam_companion\\functions\\api\\poll.js"
import { onRequestPost as __api_poll_js_onRequestPost } from "C:\\myproject\\my_exam_companion\\functions\\api\\poll.js"
import { onRequest as __api_og_image_js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\api\\og-image.js"
import { onRequest as __api_r2_js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\api\\r2.js"
import { onRequest as __api_share_js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\api\\share.js"
import { onRequest as __brochure___path___js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\brochure\\[[path]].js"
import { onRequest as __study___path___js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\study\\[[path]].js"
import { onRequest as __syllabus___path___js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\syllabus\\[[path]].js"
import { onRequest as ___middleware_js_onRequest } from "C:\\myproject\\my_exam_companion\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/modules/study/classroom/classroom_discussion.html",
      mountPath: "/modules/study/classroom",
      method: "",
      middlewares: [],
      modules: [__modules_study_classroom_classroom_discussion_html_js_onRequest],
    },
  {
      routePath: "/modules/study/classroom/classroom_questions.html",
      mountPath: "/modules/study/classroom",
      method: "",
      middlewares: [],
      modules: [__modules_study_classroom_classroom_questions_html_js_onRequest],
    },
  {
      routePath: "/:country*/study/brochure/:slug*",
      mountPath: "/:country*/study/brochure",
      method: "",
      middlewares: [],
      modules: [____country___study_brochure___slug___js_onRequest],
    },
  {
      routePath: "/:country*/study/classroom/:path*",
      mountPath: "/:country*/study/classroom",
      method: "",
      middlewares: [],
      modules: [____country___study_classroom___path___js_onRequest],
    },
  {
      routePath: "/:country*/blog/:path*",
      mountPath: "/:country*/blog",
      method: "",
      middlewares: [],
      modules: [____country___blog___path___js_onRequest],
    },
  {
      routePath: "/api/poll",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_poll_js_onRequestGet],
    },
  {
      routePath: "/api/poll",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_poll_js_onRequestPost],
    },
  {
      routePath: "/api/og-image",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_og_image_js_onRequest],
    },
  {
      routePath: "/api/r2",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_r2_js_onRequest],
    },
  {
      routePath: "/api/share",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_share_js_onRequest],
    },
  {
      routePath: "/brochure/:path*",
      mountPath: "/brochure",
      method: "",
      middlewares: [],
      modules: [__brochure___path___js_onRequest],
    },
  {
      routePath: "/study/:path*",
      mountPath: "/study",
      method: "",
      middlewares: [],
      modules: [__study___path___js_onRequest],
    },
  {
      routePath: "/syllabus/:path*",
      mountPath: "/syllabus",
      method: "",
      middlewares: [],
      modules: [__syllabus___path___js_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]