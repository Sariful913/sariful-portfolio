# Sariful Portfolio - Netlify + Admin Panel সেটআপ গাইড

এই ফোল্ডারে আপনার Portfolio V2 সাইটের সম্পূর্ণ কোড আছে, সাথে **Admin Panel** (Decap CMS)।
Admin Panel থেকে লগইন করে আপনি নিজে ব্লগ পোস্ট লিখতে পারবেন আর PDF আপলোড করতে পারবেন -
কোড ছুঁতে হবে না। সাইটে কিছু বদলালেই Netlify নিজে নিজে নতুন ভার্সন লাইভ করে দেবে।

> নোট: muse.ai-এর সাইটটা যেমন আছে তেমনই থাকবে। এটা তার আলাদা কপি, শুধু Netlify-র জন্য।

---

## যা যা লাগবে (একবারই)

1. **GitHub অ্যাকাউন্ট** (ফ্রি) - github.com এ Sign up করুন, না থাকলে।
2. **Netlify অ্যাকাউন্ট** (ফ্রি) - আপনার ইতিমধ্যে আছে।

---

## ধাপ ১ - GitHub-এ কোড তোলা

1. github.com এ গিয়ে **New repository** ক্লিক করুন।
2. Repository name দিন: `sariful-portfolio` (যেকোনো নাম চলবে)।
3. **Public** সিলেক্ট করুন, **Create repository** ক্লিক করুন।
4. নতুন রিপোর **uploading an existing file** লিংকে ক্লিক করুন।
5. এই ফোল্ডারের **সব ফাইল** (index.html, content-loader.js, content, images, admin, netlify.toml)
   ড্র্যাগ করে ছেড়ে দিন, তারপর **Commit changes** ক্লিক করুন।

## ধাপ ২ - Netlify-তে সাইট বানানো

1. app.netlify.com এ গিয়ে **Add new site → Import an existing project** ক্লিক করুন।
2. **GitHub** সিলেক্ট করুন, আপনার `sariful-portfolio` রিপোটি বেছে নিন।
3. Build settings কিছু বদলাতে হবে না - **Deploy site** ক্লিক করুন।
4. ১-২ মিনিটে সাইট লাইভ হবে, ঠিকানা হবে `https://sariful-portfolio.netlify.app` এর মতো।
   (পরে Site settings → Site details থেকে নাম বদলে `sariful.netlify.app` করা যায়, যদি খালি থাকে।)

## ধাপ ৩ - Admin Panel চালু করা (Identity + Git Gateway)

1. Netlify-তে আপনার সাইটের **Site configuration → Identity** এ যান।
2. **Enable Identity** ক্লিক করুন।
3. নিচে **Services** অংশে **Enable Git Gateway** ক্লিক করুন।
4. **Identity → Invite users** এ গিয়ে আপনার নিজের ইমেইল (s.i.mahiyan@gmail.com) দিয়ে Invite পাঠান।
5. ইমেইলে আসা লিংকে ক্লিক করে পাসওয়ার্ড সেট করুন।

## ধাপ ৪ - Admin Panel ব্যবহার

1. ব্রাউজারে যান: `https://আপনার-সাইট.netlify.app/admin`
2. আপনার ইমেইল আর পাসওয়ার্ড দিয়ে লগইন করুন।
3. বামে দুইটা মেনু পাবেন:
   - **Blog Posts** - নতুন পোস্ট লিখুন, পুরনো পোস্ট এডিট করুন, ছবি আপলোড করুন।
     নতুন পোস্টে Post ID-তে পরের নম্বর দিন (যেমন post4)।
   - **Resources (PDF)** - নতুন PDF যোগ করুন: Free হলে Drive লিংক দিন অথবা PDF ফাইল আপলোড করুন;
     Paid হলে Type-এ paid দিন আর Price লিখুন (যেমন ৳99) - WhatsApp বাটন নিজে নিজে তৈরি হবে।
4. উপরে **Save** চাপুন, তারপর **Publish → Publish now** চাপুন।
5. প্রায় ১ মিনিটের মধ্যে সাইটে নতুন কনটেন্ট দেখা যাবে।

---

## যা Admin Panel দিয়ে করা যাবে / যাবে না

- করা যাবে: ব্লগ পোস্ট লেখা/বদলানো/মোছা, PDF যোগ করা/বদলানো, দাম বদলানো।
- করা যাবে না: ডিজাইন, রং, লেআউট, নতুন সেকশন - এগুলোর জন্য Luna-কে বলুন, Luna কোড বদলে নতুন ফাইল দেবে।

## সমস্যা হলে

- `/admin` এ গিয়ে লগইন না হলে: Identity Enable করা আছে কি না আর Invite Accept করা আছে কি না দেখুন
  (ধাপ ৩)।
- Save করার পর সাইটে বদল না দেখালে: Netlify-র Deploys পেজে দেখুন deploy শেষ হয়েছে কি না
  (সাধারণত ৩০-৬০ সেকেন্ড লাগে), তারপর ব্রাউজার Refresh করুন।
- বাকি যেকোনো সমস্যায় Luna-কে জানান।
