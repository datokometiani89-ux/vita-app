/* VITA offline assistant — smarter rule engine.
   Overrides the basic V.chatReply from data.js. Used only when the live Claude
   backend (serve.py + ANTHROPIC_API_KEY) is unavailable. It detects intent,
   answers from real profile data, understands short follow-ups ("yes", "more",
   "the menu"), answers direct data questions, and varies phrasing so replies
   don't read like fixed templates. */
(function (V) {
  var lastTopic = null;

  V.chatReply = function (msg, history) {
    var p = V.state.profile;
    var lc = (" " + (msg || "") + " ").toLowerCase().replace(/[“”„]/g, '"');
    var ka = V.lang() === "ka";
    function pick(k, e) { return ka ? k : e; }
    function hit() { for (var i = 0; i < arguments.length; i++) if (arguments[i].test(lc)) return true; return false; }
    function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
    function join(l) { return l.length > 1 ? l.slice(0, -1).join(", ") + pick(" და ", " and ") + l[l.length - 1] : (l[0] || ""); }

    var name = p.name ? p.name.split(" ")[0] : "";
    var bmi = V.bmi();
    var score = V.healthScore();
    var weight = p.weight || 85;
    var tgtW = Math.max(60, Math.round(weight - 8));
    var waist = p.waist || 110;
    var tgtWaist = Math.max(80, waist - 15);
    var concerns = V.concerns().map(function (c) { return V.t(c.key); });
    var isQ = /[?？]/.test(msg || "") || hit(/\b(how|what|when|why|which|should|can|do|is|give|show)\b/, /(როგორ|რა |რას|როდის|რატომ|რომელ|უნდა|შემიძ|მიჩვენ)/);

    function foodMenu() {
      var lines = V.foodPlan().map(function (x) {
        return "• " + (x.title[V.lang()] || x.title.en) + " (" + x.time + ", ~" + x.kcal + " " + V.t("plKcal") + ")";
      });
      return pick("აი დღის მენიუ:\n", "Here's the day menu:\n") + lines.join("\n") +
        pick("\nსრული სია „გეგმა“ ტაბშია.", "\nThe full list is in the Plan tab.");
    }

    /* topic library: each has matchers, a primary answer pool, and a deeper "more" */
    var T = {
      sugar: { m: [/შაქ|გლუკ|hba1c|დიაბ|ინსულ/, /sugar|glucose|diabet|hba1c|insulin|a1c/],
        say: [
          pick("შაქარი ახლა შენი #1 პრიორიტეტია (პრედიაბეტი). სამი ბერკეტი: დაბალი GI საუზმე ცილით, კვება ყოველ 3–4 სთ-ში გრძელი შიმშილის გარეშე, და 7,000+ ნაბიჯი დღეში.",
               "Blood sugar is your #1 priority right now (pre-diabetes). Three levers: a protein-rich low-GI breakfast, eating every 3–4h without long fasts, and 7,000+ steps a day."),
          pick("გლუკოზის სტაბილურობა გასაღებია. ჭამის შემდეგ 10–15 წთ სიარული პირდაპირ წევს პიკს; მოხსენი ტკბილი სასმელები; HbA1c გადაამოწმე ჩექაფ-გეგმიდან.",
               "Glucose stability is the goal. A 10–15 min walk after meals directly lowers the spike; drop sugary drinks; recheck HbA1c from your checkup plan.")],
        more: pick("კონკრეტულად: საუზმე — შვრია + ბერძნული იოგურტი + კენკრა; ვახშამი 20:00-მდე დაბალი ნახშირწყლებით; მოერიდე თეთრ პურს. გავხსნა სრული მენიუ? — დაწერე „მენიუ“.",
                   "Specifically: breakfast — oats + Greek yogurt + berries; dinner before 8pm, low-carb; avoid white bread. Want the full menu? — type \"menu\".") },
      weight: { m: [/წონა|დაკლ|ჭარბ|ცხიმ|მუცელ|წელ|გავხდე/, /weight|lose|fat|belly|waist|slim|leaner/],
        say: [
          pick("მიმდინარე " + weight + " კგ → სამიზნე ≈ " + tgtW + " კგ" + (bmi ? " (BMI " + bmi + ")" : "") + ". წელი " + waist + "→" + tgtWaist + " სმ. -400–600 კკალ დეფიციტი + კვირაში 3 ვარჯიში + ყოველდღიური 45 წთ სიარული.",
               "You're at " + weight + " kg → target ≈ " + tgtW + " kg" + (bmi ? " (BMI " + bmi + ")" : "") + ". Waist " + waist + "→" + tgtWaist + " cm. A 400–600 kcal deficit + 3 workouts/week + a daily 45-min walk."),
          pick("რეალური ტემპი ~0.5 კგ/კვირაში. ცილა 1.6გ/კგ-ზე გაძღომას ინარჩუნებს და კუნთს იცავს დეფიციტში.",
               "Realistic pace ~0.5 kg/week. Protein at 1.6g/kg keeps you full and protects muscle during the deficit.")],
        more: pick("მარტივი დეფიციტი: ერთი ნახშირწყლიანი კერძი შეცვალე ცილა+ბოსტნეულით, მოხსენი ტკბილი სასმელი და სამუშაო-დღის ალკოჰოლი. აწონე კვირაში ერთხელ, ერთ დროს.",
                   "Easy deficit: swap one carb-heavy meal for protein + veg, drop sugary drinks and weekday alcohol. Weigh in once a week at the same time.") },
      heart: { m: [/ქოლესტ|ლიპიდ|გულ|წნევ|არტერ/, /cholesterol|lipid|heart|ldl|hdl|triglycer|blood pressure|cardio/],
        say: [
          pick("გულ-სისხლძარღვებისთვის: ომეგა-3, ზეითუნის ზეთი, ბოჭკო 25–30გ/დღე, ნაკლები მარილი/დამუშავებული საკვები. LDL და hs-CRP გადაამოწმე.",
               "For your heart: omega-3, olive oil, 25–30g fibre/day, less salt/processed food. Recheck LDL and hs-CRP.")],
        more: pick("LDL-ის დასაწევად: ხსნადი ბოჭკო (შვრია, ლობიო), თევზი კვირაში 2-ჯერ, ტრანს-ცხიმების სრული მოხსნა. სტატინებზე გადაწყვეტს მხოლოდ ექიმი.",
                   "To lower LDL: soluble fibre (oats, beans), fish 2×/week, cut trans fats entirely. Statins are your doctor's call.") },
      energy: { m: [/ენერგ|ძილ|დაღლ|სტრეს|გადაწვ|შფოთ|განწყ|დეპრეს/, /energy|sleep|tired|fatigue|stress|burnout|anxious|mood|mental|depress|insomnia/],
        say: [
          pick("ენერგიასა და განწყობას ძილი მართავს: 7–8 სთ, კოფეინი 14:00-მდე, 1 სთ ეკრანის გარეშე ძილის წინ. დილით 10 წთ სუნთქვა/mindfulness.",
               "Sleep drives your energy and mood: 7–8h, caffeine before 2pm, 1 screen-free hour before bed. 10 min morning breathing/mindfulness.")],
        more: pick("თუ შფოთვა/დაქვეითება გრძელდება — PHQ-9/GAD-7 და ფსიქოლოგი გეგმაშია. დილის მზე 10–15 წთ ცირკადულ რიტმს აჯანსაღებს.",
                   "If anxiety/low mood persist — PHQ-9/GAD-7 and a psychologist are in your plan. 10–15 min of morning sunlight resets your circadian rhythm.") },
      skin: { m: [/კან|დამატენ|spf|აკნე|ნაოჭ/, /skin|moistur|spf|acne|hydrat|wrinkle/],
        say: [
          pick("კანი მშრალია — დილით ჰიალურონის/ცერამიდების დამატენიანებელი + SPF 30+ (თბილისშიც), საღამოს რბილი დასუფთავება + მკვებავი კრემი. შიგნიდან: 2–2.5ლ წყალი და ომეგა-3.",
               "Your skin is dry — morning hyaluronic/ceramide moisturizer + SPF 30+ (even in Tbilisi), evening gentle cleanse + rich cream. Inside: 2–2.5L water and omega-3.")],
        more: pick("მშრალი კანი ხშირად დაბალ ფერიტინს, B12-ს ან TSH-ს უკავშირდება — „კანი/თმა“ პანელშია ასატვირთად. რეტინოლი (ღამით, დაბალი დოზით) ტექსტურას აუმჯობესებს.",
                   "Dry skin often tracks with low ferritin, B12 or TSH — they're in the Skin & Hair panel. A low-dose nightly retinol improves texture.") },
      hair: { m: [/თმა|ცვენ|მელოტ/, /hair|thinning|bald|scalp|shedding/],
        say: [
          pick("თმა თხელდება — ცილით მდიდარი კვება, სტრესის შემცირება და ძილი, რეცხვა კვირაში 2–3-ჯერ ცხელი წყლის გარეშე, კვირაში სკალპის მასაჟი.",
               "Hair is thinning — protein-rich diet, less stress and better sleep, wash 2–3×/week avoiding hot water, weekly scalp massage.")],
        more: pick("ფერიტინი, ტესტოსტერონი და TSH გადაამოწმე — ეს სამი ხშირად დგას ცვენის უკან. ბიოტინი მხოლოდ დეფიციტში ეხმარება.",
                   "Check ferritin, testosterone and TSH — common drivers of shedding. Biotin only helps if you're actually deficient.") },
      oral: { m: [/კბილ|ღრძ|პირის ღრუ|სტომატ|ფლოს/, /oral|dental|teeth|gum|floss|caries|cavity/],
        say: [
          pick("პირის ღრუ: ყოველდღიური ფლოსი, ალკოჰოლის გარეშე საწმენდი, წმენდა ექიმთან ყოველ 6 თვეში. ღრძილების სისხლდენა (BOP) მეტაბოლიზმსაც უკავშირდება.",
               "Oral: daily flossing, alcohol-free mouthwash, a cleaning every 6 months. Bleeding gums (BOP) link to metabolism too.")],
        more: pick("BOP-ისა და gingival ინდექსის ასატვირთად „სტომატოლოგია“ პანელია. შაქრის კონტროლი პირდაპირ აუმჯობესებს ღრძილებს.",
                   "Use the Dental panel to log BOP and the gingival index. Controlling blood sugar directly improves your gums.") },
      food: { m: [/კვებ|დიეტ|საჭმ|მენიუ|კალორ|ცილ|ნახშირწყ|ვჭამ/, /food|diet|eat|meal|menu|calorie|protein|carb|nutrition/],
        say: [
          pick("სამიზნე ~1,900–2,100 კკალ/დღეში. ცილა (თევზი, ქათამი, კვერცხი), დაბალი GI ნახშირწყლები (შვრია, წიწიბურა, ბოსტნეული), ჯანსაღი ცხიმი, ბოჭკო 25–30გ. მოერიდე თეთრ პურს, შაქარს, დამუშავებულ საკვებს.",
               "Target ~1,900–2,100 kcal/day. Protein (fish, chicken, eggs), low-GI carbs (oats, buckwheat, veg), healthy fats, 25–30g fibre. Avoid white bread, sugar, processed food.")],
        more: foodMenu },
      exercise: { m: [/ვარჯ|ფიტნეს|სპორტ|ნაბიჯ|სიარ|დარბ/, /exercise|workout|train|fitness|gym|steps|walk|run|cardio/],
        say: [
          pick("კვირაში 3-ჯერ ძალისმიერი (აზიდვები, ჩაჯდომები, კორი) + ყოველდღიური 45 წთ სიარული (8–10 ათასი ნაბიჯი). ადექი ყოველ 60 წუთში.",
               "3×/week strength (push-ups, squats, core) + a daily 45-min walk (8–10k steps). Stand up every 60 min.")],
        more: pick("3-დღიანი სქემა: ორშ — ქვედა სხეული, ოთხ — ზედა, პარ — კორი + სიარული. თითო 25–30 წთ. პროგრესი = ყოველ კვირას +1 გამეორება.",
                   "3-day split: Mon — lower body, Wed — upper, Fri — core + walk. 25–30 min each. Progress = +1 rep each week.") },
      checkup: { m: [/ჩექაფ|შემოწმ|სკრინ|ანალიზ|ექიმ|კლინიკ/, /checkup|check-up|screen|test|lab|doctor|clinic|appointment/],
        say: [
          pick("ჩექაფ-გეგმა პრიორიტეტებითაა — პირველ რიგში შაქარი (HbA1c) და ლიპიდები. „გეგმა/შემოწმება“-ში თითო კალენდარში დაამატე, შედეგები კი „+“ ღილაკით ატვირთე.",
               "Your checkup plan is priority-ordered — blood sugar (HbA1c) and lipids first. Add each to your calendar from the Checkup screen, then upload results via the “+” button.")],
        more: pick("უახლოესი 2 კვირა: უზმოზე გლუკოზა + HbA1c, ლიპიდები, ღვიძლი (AST/ALT), TSH, ვიტამინი D." + (p.sex !== "woman" ? " 35+ ასაკში PSA საბაზისო." : ""),
                   "Next 2 weeks: fasting glucose + HbA1c, lipids, liver (AST/ALT), TSH, vitamin D." + (p.sex !== "woman" ? " At 35+, a baseline PSA." : "")) },
      meds: { m: [/მედიკ|წამ|აბი|დოზ|დანამატ|ომეგა|მეტფორ|სტატ/, /medication|medicine|drug|pill|dose|supplement|metformin|statin|omega|vitamin/],
        say: [
          pick("კალენდარში: დილით ომეგა-3 + D3 (საუზმესთან), საღამოს — ექიმის დანიშნულებით — მეტფორმინი/ატორვასტატინი (ვახშამთან). დოზებს მხოლოდ ექიმი წყვეტს.",
               "Calendar: omega-3 + D3 in the morning (with breakfast); in the evening — if prescribed — metformin/atorvastatin (with dinner). Doses are your doctor's call.")],
        more: pick("ომეგა-3 ცხიმიან კერძთან უკეთ შეიწოვება; D3 დილით; მეტფორმინი ვახშამთან კუჭის გასაადვილებლად. სანამ დაიწყებ, ექიმს გადაუმოწმე.",
                   "Omega-3 absorbs better with a fatty meal; D3 in the morning; metformin with dinner to ease the stomach. Confirm with your doctor before starting.") },
      alcohol: { m: [/ალკოჰ|ღვინ|ლუდ|სასმ/, /alcohol|drink|wine|beer|booze/],
        say: [pick("სამუშაო დღეებში ალკოჰოლის გარეშე, შაბათ-კვირას მაქს. 1–2 სასმელი. ალკოჰოლი პირდაპირ ეხება ღვიძლს, ძილს და შაქარს.",
                   "Weekdays alcohol-free, weekends max 1–2 drinks. Alcohol directly affects your liver, sleep and blood sugar.")] },
      water: { m: [/წყალ|ჰიდრატ/, /water|hydrat/],
        say: [pick("მიზანი 2–2.5ლ წყალი დღეში. დაიწყე დილით 1 ჭიქით — ენერგიასაც, კანსაც და მადასაც არეგულირებს.",
                   "Aim for 2–2.5L water a day. Start with 1 glass each morning — helps energy, skin and appetite.")] },
    };

    /* ---- direct data questions ---- */
    if (hit(/\bbmi\b/, /ბმი|ბი ?ემ ?აი/)) return pick(
      "შენი BMI არის " + (bmi || "?") + " — " + (bmi >= 30 ? "სიმსუქნის ზონა" : bmi >= 25 ? "ჭარბი წონა" : bmi >= 18.5 ? "ნორმა" : "დაბალი") + ". " + tgtW + " კგ-მდე კლება ჯანსაღ დიაპაზონს დააბრუნებს.",
      "Your BMI is " + (bmi || "?") + " — " + (bmi >= 30 ? "obese" : bmi >= 25 ? "overweight" : bmi >= 18.5 ? "normal" : "low") + ". Reaching " + tgtW + " kg brings it back to a healthy range.");
    if (hit(/რამდენი ნაბ|ნაბიჯ.*რამდენ/, /how many steps|step goal/)) return pick(
      "სამიზნე 7,000–10,000 ნაბიჯი დღეში. ჭამის შემდეგ 10–15 წთ სიარული განსაკუთრებით კარგია შენი შაქრისთვის.",
      "Target 7,000–10,000 steps a day. A 10–15 min walk after meals is especially good for your blood sugar.");
    if (hit(/რამდენი კალ|კალორ.*რამდენ/, /how many calor|calorie target/)) return pick(
      "სამიზნე ~1,900–2,100 კკალ/დღეში (შენახვა ~2,400–2,600-დან -400–600 დეფიციტი).",
      "Target ~1,900–2,100 kcal/day (a 400–600 deficit from ~2,400–2,600 maintenance).");
    if (hit(/საუზმე|დილ.*ვჭამ/, /breakfast/)) return pick(
      "საუზმე (~08:00, ~450 კკალ): შვრია (50გ), ბერძნული იოგურტი (150გ), კენკრა (100გ), ნიგოზი (15გ). დაბალი GI — შაქარს არ ახტუნებს.",
      "Breakfast (~8am, ~450 kcal): oats (50g), Greek yogurt (150g), berries (100g), walnuts (15g). Low-GI — won't spike your sugar.");

    /* ---- greeting / thanks ---- */
    if (hit(/გამარ|სალამ|ჰეი|ბარევ/, /\b(hello|hi|hey|yo|hiya)\b/)) return pick(
      "გამარჯობა" + (name ? " " + name : "") + "! 👋 " + (concerns.length ? "ახლა ყველაზე მეტ ყურადღებას ითხოვს: " + join(concerns.slice(0, 3)) + ". რომელით დავიწყოთ?" : "რით დაგეხმარო?"),
      "Hi" + (name ? " " + name : "") + "! 👋 " + (concerns.length ? "Your top focus areas are " + join(concerns.slice(0, 3)) + ". Where should we start?" : "How can I help?"));
    if (hit(/მადლ|გმადლ/, /\b(thanks|thank you|thx|cheers|appreciate)\b/)) return rnd([
      pick("არაფერს" + (name ? " " + name : "") + " 🙌", "Anytime" + (name ? ", " + name : "") + " 🙌"),
      pick("სიამოვნებით — აქ ვარ, როცა დაგჭირდები.", "My pleasure — I'm here whenever you need me.")]);

    /* ---- score / status ---- */
    if (hit(/ქულა|სტატუს|მდგომარ|როგორ ვარ/, /\b(score|status|overall|how am i)\b/)) {
      var band = score >= 71 ? pick("კარგ ზონაში", "in the good range") : score >= 41 ? pick("ზომიერი ყურადღების ზონაში", "in the moderate-attention range") : pick("რისკ-ზონაში", "in the risk range");
      return pick(
        "ჯანმრთელობის ქულა — " + score + "/100, " + band + ". " + (concerns.length ? "მთავარი ბერკეტებია: " + join(concerns.slice(0, 3)) + ". რომელ მათგანზე გავიღრმავოთ?" : "გააგრძელე ასე!"),
        "Health score — " + score + "/100, " + band + ". " + (concerns.length ? "Biggest levers: " + join(concerns.slice(0, 3)) + ". Which one should we go deeper on?" : "Keep it up!"));
    }

    /* ---- match a topic ---- */
    var key = null;
    for (var k in T) { if (T[k].m.some(function (re) { return re.test(lc); })) { key = k; break; } }
    if (key) {
      lastTopic = key;
      var tp = T[key];
      if (isQ && tp.more) return typeof tp.more === "function" ? tp.more() : tp.more;
      return rnd(tp.say);
    }

    /* ---- short follow-up referencing the last topic ---- */
    var follow = hit(/^\s*(კი|დიახ|ჰო|კარგ|გასაგ|აბა|ოკ|ოქ|მინდ|გავაგრძ|მეტი|დეტალ|მენიუ|მირჩ)/,
                     /^\s*(yes|yeah|yep|ok|okay|sure|please|more|go on|continue|details?|show|menu|the menu)\b/);
    if (follow && lastTopic && T[lastTopic]) {
      var tp2 = T[lastTopic];
      return tp2.more ? (typeof tp2.more === "function" ? tp2.more() : tp2.more) : rnd(tp2.say);
    }

    /* ---- fallback ---- */
    return rnd([
      pick("ამაზე ცოტა მეტი კონტექსტი დამეხმარება. შემიძლია კონკრეტული ნაბიჯები მოგცე: შაქარი, წონა, ენერგია, კვება, ვარჯიში, კანი, თმა ან ჩექაფი — რომელი?",
           "A bit more context would help. I can give concrete steps on blood sugar, weight, energy, food, exercise, skin, hair or checkups — which one?"),
      pick("კარგი კითხვაა. შენი ჰოლისტიკური გეგმა 4 მიმართულებას მოიცავს — ზოგადი, მენტალური, სხეული, გარეგნობა. დააზუსტე და დეტალს მოგცემ.",
           "Good question. Your plan spans 4 tracks — general, mental, body, appearance. Tell me which and I'll get specific."),
      pick((concerns.length ? "შენი მონაცემებით ახლა მთავარია " + join(concerns.slice(0, 2)) + ". " : "") + "მკითხე მაგ.: „რა ვჭამო საუზმეზე“, „რამდენი ნაბიჯი“ ან „როგორ დავწიო შაქარი“.",
           (concerns.length ? "Your data points to " + join(concerns.slice(0, 2)) + " right now. " : "") + "Ask me e.g. \"what should I eat for breakfast\", \"how many steps\" or \"how do I lower my blood sugar\".")]);
  };
})(window.VITA);
