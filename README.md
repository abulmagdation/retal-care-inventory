# رتال كير — مخزون الأجهزة الطبية

تطبيق عربي لإدارة الأجهزة الطبية وعقود إيجارها، مبني بـ React وMaterial UI وExpress وMongoDB. واجهة الإنتاج وواجهات API تُقدَّم من حاوية واحدة، وصور الأجهزة محفوظة في MongoDB GridFS.

## التشغيل محليًا

1. انسخ `.env.example` إلى `.env`، وعدّل `MONGODB_URI` و`JWT_SECRET` و`SEED_ADMIN_PASSWORD` لقيم خاصة بك. لا ترفع `.env` إلى GitHub.
2. شغّل `npm ci` ثم `npm run seed` لإنشاء المدير لأول مرة. إذا كان البريد موجودًا بالفعل، لن يغيّر الأمر بياناته.
3. شغّل `npm run dev` وافتح `http://localhost:5173`. يوجّه Vite طلبات `/api` إلى Express على المنفذ 5000.

لمعاينة التصميم دون قاعدة بيانات: شغّل `VITE_DEMO_MODE=true` عند بناء الواجهة محليًا فقط. لا تستخدم وضع العرض التجريبي في الإنتاج.

## الاختبارات والبناء

- `npm run build` يبني واجهة React داخل `client/dist`.
- `npm start` يشغّل Express ويقدّم الواجهة المبنية و`/api` من نفس العنوان.
- `npm run test:smoke` يختبر المسارات الأساسية على قاعدة MongoDB مؤقتة منفصلة ويحذفها بعد انتهاء الاختبار؛ يتطلب MongoDB محليًا.

## النشر على Google Cloud Run من GitHub

المستودع يحتوي `Dockerfile` في الجذر، وملف `.dockerignore` يستبعد ملفات الأسرار وملفات التطوير. الحاوية تبني React ثم تشغّل Express على `0.0.0.0` والمنفذ الذي تحدده Cloud Run في `PORT` (8080 افتراضيًا). تستخدم الواجهة `/api` من نفس النطاق، فلا تحتاج إلى `VITE_API_URL` أو `CLIENT_URL` عند نشر الحاوية الواحدة.

1. جهّز قاعدة MongoDB دائمة يمكن الوصول إليها من Cloud Run، مثل MongoDB Atlas، وأنشئ مستخدم قاعدة بصلاحيات التطبيق. لا تستخدم عنوان `localhost` في `MONGODB_URI` السحابي.
2. احفظ `MONGODB_URI` و`JWT_SECRET` في Google Secret Manager، واربطهما بمتغيرَي البيئة المناظرين في خدمة Cloud Run. يجب أن يكون `JWT_SECRET` عشوائيًا وفريدًا، بطول 32 حرفًا على الأقل. امنح هوية خدمة Cloud Run صلاحية قراءة السرّين.
3. أنشئ المدير **مرة واحدة** على قاعدة الإنتاج بتشغيل `npm run seed` في بيئة آمنة مضبوطة على نفس `MONGODB_URI` مع `SEED_ADMIN_EMAIL` و`SEED_ADMIN_PASSWORD` قوي وفريد (12 حرفًا على الأقل). يمكن تنفيذ ذلك كـ Cloud Run Job باستخدام نفس الصورة. لا تضع كلمة المرور داخل المستودع، ولا تعتمد على الحسابات التجريبية.
4. من Cloud Run اختر النشر المستمر من GitHub، وحدد المستودع والفرع، ثم طريقة البناء `Dockerfile`، بمسار `Dockerfile` وسياق البناء `.`. اربط الأسرار قبل أول تشغيل. يمكن السماح بالوصول العام للخدمة كي تظهر صفحة تسجيل الدخول؛ عمليات التطبيق نفسها تتطلب تسجيل الدخول.
5. تحقق من `https://YOUR-SERVICE-URL/api/health` ثم افتح رابط الخدمة وسجّل الدخول. إذا كانت قاعدة البيانات تستخدم قائمة سماح لعناوين IP، اضبط اتصال Cloud Run الصادر وفق إعدادات الشبكة الخاصة بها؛ عناوين Cloud Run الصادرة ليست ثابتة تلقائيًا.

لا تحفظ صور الأجهزة أو قاعدة MongoDB داخل نظام ملفات الحاوية؛ الحاويات مؤقتة. الصور الحالية تُحفظ في GridFS داخل قاعدة MongoDB المحددة.

مراجع Google Cloud: [النشر المستمر من GitHub](https://docs.cloud.google.com/run/docs/continuous-deployment)، [متطلبات المنفذ للحاوية](https://docs.cloud.google.com/run/docs/container-contract)، [ربط الأسرار](https://docs.cloud.google.com/run/docs/configuring/services/secrets)، [عنوان خروج ثابت عند الحاجة](https://docs.cloud.google.com/run/docs/configuring/static-outbound-ip).
