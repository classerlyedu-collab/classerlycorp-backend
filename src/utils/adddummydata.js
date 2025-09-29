// const adminModel = require("../models/admin");
// const authModel = require("../models/auth");
// const gradeModel = require("../models/grade.models");
// const subjectModel = require("../models/subject");
// const { generateSixDigitCode } = require("./generateotp");

// const registerAdmin = async () => {
//   let auth = await new authModel({
//     fullName: "admin",
//     userName: "admin",
//     password: "admin",
//     email: "admin@admin.com",
//     fullAddress: "abc",
//     userType: "Admin",
//   }).save();
//   await adminModel.create({
//     code: generateSixDigitCode(),
//     auth: auth._id,
//   });
// };

// const addgrades = async () => {
//   const subjects = [
//     [
//       {
//         img: "subject1",
//         title: "Mathematics",
//         bgColor: "#3bc6df",
//         link: "Mathematics3",
//       },
//       {
//         img: "subject2",
//         title: "Science and Technology",
//         bgColor: "#7A3FF7",
//         link: "Science-and-Technology3",
//       },
//       { img: "subject3", title: "Arts", bgColor: "#D54041", link: "Arts3" },
//       {
//         img: "subject4",
//         title: "Health And Physical Education",
//         bgColor: "#56CD78",
//         link: "Health-And-Physical-Education3",
//       },
//       {
//         img: "subject2",
//         title: "French immersion Program",
//         bgColor: "#7A3FF7",
//         link: "French-immersion-Program3",
//       },
//       {
//         img: "subject3",
//         title: "Language",
//         bgColor: "#D54041",
//         link: "Language3",
//       },
//       {
//         img: "subject4",
//         title: "Native Language",
//         bgColor: "#56CD78",
//         link: "Native-Language3",
//       },
//       {
//         img: "subject2",
//         title: "Social Studies",
//         bgColor: "#7A3FF7",
//         link: "Social-Studies3",
//       },
//     ],
//     [
//       {
//         img: "subject1",
//         title: "Mathematics",
//         bgColor: "#3bc6df",
//         link: "Mathematics4",
//       },
//       {
//         img: "subject2",
//         title: "Science and Technology",
//         bgColor: "#7A3FF7",
//         link: "Science-and-Technology4",
//       },
//       {
//         img: "subject2",
//         title: "French Immersion Program",
//         bgColor: "#7A3FF7",
//         link: "French-immersion-Program4",
//       },
//       {
//         img: "subject3",
//         title: "Core French Program",
//         bgColor: "#D54041",
//         link: "Core-French-Program4",
//       },
//       {
//         img: "subject3",
//         title: "Extended French",
//         bgColor: "#D54041",
//         link: "Extended-French4",
//       },
//       {
//         img: "subject4",
//         title: "Health And Physical Education",
//         bgColor: "#56CD78",
//         link: "Health-And-Physical-Education4",
//       },
//       { img: "subject3", title: "Arts", bgColor: "#D54041", link: "Arts4" },
//       {
//         img: "subject3",
//         title: "Language",
//         bgColor: "#D54041",
//         link: "Language4",
//       },
//       {
//         img: "subject4",
//         title: "Native Language",
//         bgColor: "#56CD78",
//         link: "Native-Language4",
//       },
//       {
//         img: "subject2",
//         title: "Social Studies",
//         bgColor: "#7A3FF7",
//         link: "Social-Studies4",
//       },
//     ],
//     [
//       {
//         img: "subject1",
//         title: "Mathematics",
//         bgColor: "#3bc6df",
//         link: "Mathematics5",
//       },
//       {
//         img: "subject2",
//         title: "Science and Technology",
//         bgColor: "#7A3FF7",
//         link: "Science-and-Technology5",
//       },
//       { img: "subject3", title: "Arts", bgColor: "#D54041", link: "Arts5" },
//       {
//         img: "subject3",
//         title: "Core French Program",
//         bgColor: "#D54041",
//         link: "Core-French-Program5",
//       },
//       {
//         img: "subject3",
//         title: "Extended French",
//         bgColor: "#D54041",
//         link: "Extended-French5",
//       },
//       {
//         img: "subject4",
//         title: "Health And Physical Education",
//         bgColor: "#56CD78",
//         link: "Health-And-Physical-Education5",
//       },
//       {
//         img: "subject3",
//         title: "French Immersion Program",
//         bgColor: "#D54041",
//         link: "French-immersion-Program5",
//       },
//       {
//         img: "subject3",
//         title: "Language",
//         bgColor: "#D54041",
//         link: "Language5",
//       },
//       {
//         img: "subject4",
//         title: "Native Language",
//         bgColor: "#56CD78",
//         link: "Native-Language5",
//       },
//       {
//         img: "subject2",
//         title: "Social Studies",
//         bgColor: "#7A3FF7",
//         link: "Social-Studies5",
//       },
//     ],
//     [
//       {
//         img: "subject1",
//         title: "Mathematics",
//         bgColor: "#3bc6df",
//         link: "Mathematics6",
//       },
//       {
//         img: "subject2",
//         title: "Science and Technology",
//         bgColor: "#7A3FF7",
//         link: "Science-and-Technology6",
//       },
//       {
//         img: "subject3",
//         title: "Core French Program",
//         bgColor: "#D54041",
//         link: "Core-French-Program6",
//       },
//       {
//         img: "subject3",
//         title: "Extended French",
//         bgColor: "#D54041",
//         link: "Extended-French6",
//       },
//       {
//         img: "subject4",
//         title: "Health And Physical Education",
//         bgColor: "#56CD78",
//         link: "Health-And-Physical-Education6",
//       },
//       {
//         img: "subject3",
//         title: "French Immersion Program",
//         bgColor: "#D54041",
//         link: "French-immersion-Program6",
//       },
//       {
//         img: "subject3",
//         title: "Language",
//         bgColor: "#D54041",
//         link: "Language6",
//       },
//       {
//         img: "subject4",
//         title: "Native Language",
//         bgColor: "#56CD78",
//         link: "Native-Language6",
//       },
//       {
//         img: "subject2",
//         title: "Social Studies",
//         bgColor: "#7A3FF7",
//         link: "Social-Studies6",
//       },
//       { img: "subject3", title: "Arts", bgColor: "#D54041", link: "Arts6" },
//     ],
//     [
//       {
//         img: "subject1",
//         title: "Mathematics",
//         bgColor: "#3bc6df",
//         link: "Mathematics7",
//       },
//       {
//         img: "subject2",
//         title: "Science and Technology",
//         bgColor: "#7A3FF7",
//         link: "Science-and-Technology7",
//       },
//       { img: "subject3", title: "Arts", bgColor: "#D54041", link: "Arts7" },
//       {
//         img: "subject3",
//         title: "Extended French",
//         bgColor: "#D54041",
//         link: "Extended-French7",
//       },
//       {
//         img: "subject4",
//         title: "Health And Physical Education",
//         bgColor: "#56CD78",
//         link: "Health-And-Physical-Education7",
//       },
//       {
//         img: "subject3",
//         title: "French Immersion Program",
//         bgColor: "#D54041",
//         link: "French-immersion-Program7",
//       },
//       {
//         img: "subject3",
//         title: "Core French Program",
//         bgColor: "#D54041",
//         link: "Core-French-Program7",
//       },
//       {
//         img: "subject4",
//         title: "Native Language",
//         bgColor: "#56CD78",
//         link: "Native-Language7",
//       },
//       {
//         img: "subject3",
//         title: "Language",
//         bgColor: "#D54041",
//         link: "Language7",
//       },
//       {
//         img: "subject2",
//         title: "History Geography",
//         bgColor: "#7A3FF7",
//         link: "History-Geography7",
//       },
//     ],
//     [
//       {
//         img: "subject1",
//         title: "Mathematics",
//         bgColor: "#3bc6df",
//         link: "Mathematics8",
//       },
//       {
//         img: "subject2",
//         title: "Science and Technology",
//         bgColor: "#7A3FF7",
//         link: "Science-and-Technology8",
//       },
//       { img: "subject3", title: "Arts", bgColor: "#D54041", link: "Arts8" },
//       {
//         img: "subject4",
//         title: "Health And Physical Education",
//         bgColor: "#56CD78",
//         link: "Health-And-Physical-Education8",
//       },
//       {
//         img: "subject3",
//         title: "Core French Program",
//         bgColor: "#D54041",
//         link: "Core-French-Program8",
//       },
//       {
//         img: "subject3",
//         title: "Extended French",
//         bgColor: "#D54041",
//         link: "Extended-French8",
//       },
//       {
//         img: "subject3",
//         title: "French Immersion Program",
//         bgColor: "#D54041",
//         link: "French-immersion-Program8",
//       },
//       {
//         img: "subject3",
//         title: "Language",
//         bgColor: "#D54041",
//         link: "Language8",
//       },
//       {
//         img: "subject4",
//         title: "Native Language",
//         bgColor: "#56CD78",
//         link: "Native-Language8",
//       },
//       {
//         img: "subject2",
//         title: "History Geography",
//         bgColor: "#7A3FF7",
//         link: "History-Geography8",
//       },
//     ],
//     [
//       //ARTS START
//       {
//         img: "subject2",
//         title: "Dance - Open",
//         bgColor: "#D54041",
//         link: "Dance-open9",
//       },
//       {
//         img: "subject3",
//         title: "Drama - Open ",
//         bgColor: "#D54041",
//         link: "Drama-open9",
//       },
//       {
//         img: "subject3",
//         title: "Music - Open",
//         bgColor: "#D54041",
//         link: "Music-open9",
//       },
//       {
//         img: "subject4",
//         title: "Integrated Arts - Open",
//         bgColor: "#56CD78",
//         link: "Integrated-Arts-open9",
//       },
//       {
//         img: "subject3",
//         title: "Visual Arts - Open",
//         bgColor: "#D54041",
//         link: "Visual-Arts-open9",
//       },

//       //FRENCH START
//       {
//         img: "subject2",
//         title: "Core French, Grade 9 Academic FSF1D",
//         bgColor: "#7A3FF7",
//         link: "Core-French-Grade-9-Academic-FSF1D-9",
//       },
//       {
//         img: "subject2",
//         title: "Core French,Grade 9  Open FSF1O",
//         bgColor: "#7A3FF7",
//         link: "Core-French-Grade-9-Open-FSF1O-9",
//       },
//       {
//         img: "subject2",
//         title: "Extended French, Grade 9 Academic FEF1D",
//         bgColor: "#7A3FF7",
//         link: "Extended-French-Grade-9-Academic-FEF1D-9",
//       },
//       {
//         img: "subject2",
//         title: "French Immersion, Grade 9 Academic FIF1D",
//         bgColor: "#7A3FF7",
//         link: "Core-French-Grade-9-Academic-FIF1D-9",
//       },
//       //MATHS START

//       {
//         img: "subject3",
//         title: "MTH1W Grade 9 Issued: 2021 Mathematics",
//         bgColor: "#7A3FF7",
//         link: "MTH1W-Grade-9-Issued-2021-Mathematics-9",
//       },

//       //BUSINESS STUDIES START

//       {
//         img: "subject4",
//         title: "Introduction to Business",
//         bgColor: "#56CD78",
//         link: "Introduction-To-Business-9",
//       },
//       {
//         img: "subject4",
//         title: "Information and communication Technology in Business",
//         bgColor: "#56CD78",
//         link: "Information-and-Communication-Technology-in-Business-9",
//       },

//       //CANADIAN AND WORLD STUDIES START

//       {
//         img: "subject2",
//         title: "Issues in Canadian Geography, Grade 9 Academic GCC1D",
//         bgColor: "#7A3F7A",
//         link: "Issues-in-Canadian-Geography-Grade-9-Academic-GCC1D-9",
//       },

//       //ENGLISH START

//       {
//         img: "subject1",
//         title: "ENL1W Grade 9 Issued: 2023 English",
//         bgColor: "#3bc6df",
//         link: "ENL1W-Grade-9-Issued-2023-English-9",
//       },

//       //First Nations,Metis and Inuit Studies (2019) START
//       {
//         img: "subject1",
//         title:
//           "NAC1O Grade 9 Expressions of First Nations, Métis, and Inuit Cultures",
//         bgColor: "#339FFF",
//         link: "NAC1O-Grade-9-Expressions-of-First-Nations-Metis-and-Inuit-Cultures-9",
//       },

//       //GUIDANCE AND CAREER EDUCATION

//       {
//         img: "subject1",
//         title:
//           "Learning Strategies 1: (GLS1O/GLE1O/GLE2O) Skills for Success in Secondary School, Grade 9, Open",
//         bgColor: "#FF9C33",
//         link: "Learning-Strategies-1-Skills-for-Success-in-Secondary-School-Grade-9-Open-9",
//       }, //1
//       {
//         img: "subject1",
//         title:
//           "Learning Strategies 1: (GLS1O/GLE1O/GLE2O) Skills for Success in Secondary School, Grade 9, Open",
//         bgColor: "#FF9C33",
//         link: "Learning-Strategies-1-Skills-for-Success-in-Secondary-School-Grade-9-9",
//       }, //2
//       {
//         img: "subject1",
//         title:
//           "Learning Strategies 1: (GLS1O/GLE1O/GLE2O) Skills for Success in Secondary School, Grade 9, Open ",
//         bgColor: "#FF9C33",
//         link: "Learning-Strategies-1-Skills-for-Success-in-Secondary-School-9",
//       }, //3

//       ///HEALTH AND PHYSICAL EDUCATION START

//       {
//         img: "subject4",
//         title: "Healthy Active Living  Education, Grade 9 Open PPL1O",
//         bgColor: "#33FF42",
//         link: "Healthy-Active-Living-Education-Grade-9-Open-PPL1O-9",
//       },

//       //SCIENCE
//       {
//         img: "subject4",
//         title: "SNC1WGrade 9 Issued: 2022 Science",
//         bgColor: "#FF33EC",
//         link: "Healthy-Active-Living-Education-Grade-9-Open-PPL1O-9",
//       },

//       //SOCIAL SCIENCES AND HUMANITIES START

//       {
//         img: "subject4",
//         title: "Food and Nutrition, Grade 9 or 10 Open HFN1O/2O",
//         bgColor: "#33FFD4",
//         link: "Food-and-Nutrition-Grade-9-or-10-Open-HFN1O-2O-9",
//       },

//       //TECHNOLOGICAL EDUCATION START

//       {
//         img: "subject4",
//         title: "Exploring Technologies, Grade 9   Open TIJ1O",
//         bgColor: "#FF3352",
//         link: "Exploring-Technologies-Grade-9-Open-TIJ1O-9",
//       },
//     ],
//     [
//       //ARTS START
//       {
//         img: "subject2",
//         title: "Dance - Open",
//         bgColor: "#D54041",
//         link: "Dance-open10",
//       },
//       {
//         img: "subject3",
//         title: "Drama - Open ",
//         bgColor: "#D54041",
//         link: "Drama-open10",
//       },
//       {
//         img: "subject3",
//         title: "Music - Open",
//         bgColor: "#D54041",
//         link: "Music-open10",
//       },
//       {
//         img: "subject4",
//         title: "Integrated Arts - Open",
//         bgColor: "#D54041",
//         link: "Integrated-Arts-open10",
//       },
//       {
//         img: "subject3",
//         title: "Visual Arts - Open",
//         bgColor: "#D54041",
//         link: "Visual-Arts-open10",
//       },
//       {
//         img: "subject2",
//         title: "Media Arts - Open (ASM20)",
//         bgColor: "#D54041",
//         link: "History-Geography10",
//       },

//       //FRENCH START
//       {
//         img: "subject2",
//         title: "Core French, Grade 10 Academic FSF2D",
//         bgColor: "#7A3FF7",
//         link: "Core-French-Grade-10-Academic-FSF2D-10",
//       },
//       {
//         img: "subject1",
//         title: "Core French, Grade 10 Applied FSF2P",
//         bgColor: "#7A3FF7",
//         link: "Core-French-Grade-10-Applied-FSF2P-10",
//       },
//       {
//         img: "subject1",
//         title: "Core French, Grade 10 Open FSF20",
//         bgColor: "#7A3FF7",
//         link: "Core-French-Grade-10-Open-FSF20-10",
//       },
//       {
//         img: "subject1",
//         title: "Extended French, Grade 10 Academic FEF2D",
//         bgColor: "#7A3FF7",
//         link: "Extended-French-Grade-10-Academic-FEF2D-10",
//       },
//       {
//         img: "subject2",
//         title: "French Immersion, Grade 10 Academic FIF2D",
//         bgColor: "#7A3FF7",
//         link: "French-Immersion-Grade-10-Academic-FIF2D-10",
//       },
//       {
//         img: "subject1",
//         title: "French Immersion, Grade 10 Applied FIF2P",
//         bgColor: "#7A3FF7",
//         link: "French-Immersion-Grade-10-Applied-FIF2P-10",
//       },

//       //MATHS START

//       {
//         img: "subject3",
//         title: "Principle Of Mathematics, Grade 10, Academic(MPM2D)",
//         bgColor: "#3352FF",
//         link: "Principle-Of-Mathematics-Grade-10-Academic-MPM2D",
//       },
//       {
//         img: "subject3",
//         title: "Foundations Of Mathematics, Grade 10, Applied(MFM2P)",
//         bgColor: "#3352FF",
//         link: "Foundations-Of-Mathematics-Grade-10-Applied-MFM2P",
//       },

//       //BUSINESS STUDIES START

//       {
//         img: "subject4",
//         title: "Introduction to Business",
//         bgColor: "#FFDD33",
//         link: "Introduction-To-Business-10",
//       },
//       {
//         img: "subject4",
//         title: "Information and communication Technology in Business",
//         bgColor: "#FFDD33",
//         link: "Information-and-Communication-Technology-in-Business-10",
//       },

//       //CANADIAN AND WORLD STUDIES START

//       {
//         img: "subject2",
//         title: "CHV2OGrade 10 Issued: 2022 Civics and Citizenship",
//         bgColor: "#3EE0BC",
//         link: "CHV2OGrade-10-Issued-2022-Civics-and-Citizenship-10",
//       }, //1
//       {
//         img: "subject2",
//         title: "Canadian History since World War I, Grade 10 Academic CHC2D",
//         bgColor: "#3EE0BC",
//         link: "Canadian-History-since-World-War-I-Grade-10-Academic-CHC2D-10",
//       }, //2

//       //COMPTER STUDIES

//       {
//         img: "subject4",
//         title:
//           "ICD2O Grade 10 Issued: 2023 Digital Technology and Innovations in the Changing World",
//         bgColor: "#56CD78",
//         link: "ICD2O-Grade-10-Issued-2023-Digital-Technology-and-Innovations-in-the-Changing-World-10",
//       }, //1

//       //ENGLISH START

//       {
//         img: "subject1",
//         title: "English, Grade 10 Academic ENG2D",
//         bgColor: "#3bc6df",
//         link: "English-Grade-10-Academic-ENG2D-10",
//       }, //1
//       {
//         img: "subject1",
//         title: "English, Grade 10 Applied ENG2P",
//         bgColor: "#3bc6df",
//         link: "English-Grade-10-Applied-ENG2P-10",
//       }, //2
//       {
//         img: "subject1",
//         title: "Literacy Skills: Reading and  Writing, Grade 10 Open ELS2O",
//         bgColor: "#3bc6df",
//         link: "Literacy-Skills-Reading-and-Writing-Grade-10-Open-ELS2O-10",
//       }, //3

//       //First Nations, Metis and Inuit Studies START
//       {
//         img: "subject4",
//         title: "NAC2OGrade 10 First Nations, Métis, and Inuit in Canada",
//         bgColor: "#56CD78",
//         link: "NAC2O-Grade-10-First-Nations-Metis-and-Inuit-in-Canada-10",
//       }, //1

//       //GUIDANCE AND CAREER EDUCATION START
//       {
//         img: "subject4",
//         title: "GLC2OGrade 10 Issued: 2019  Career Studies",
//         bgColor: "#56CD78",
//         link: "GLC2O-Grade-10-Issued-2019-Career-Studies-10",
//       }, //1
//       {
//         img: "subject4",
//         title: "Discovering the Workplace, Grade 10, Open (GLD2O)",
//         bgColor: "#56CD78",
//         link: "Discovering-the-Workplace-Grade-10-Open-GLD2O-10",
//       }, //2

//       //HEALTH AND PHYSICAL EDUCATION START
//       {
//         img: "subject4",
//         title: "Healthy Active Living  Education,  Grade 10 Open PPL2O",
//         bgColor: "#56CD78",
//         link: "Healthy-Active-Living-Education-Grade-10-Open-PPL2O-10",
//       }, //1

//       //SCIENCE
//       {
//         img: "subject4",
//         title: "Science, Grade 10 Applied SNC2P ",
//         bgColor: "#56CD78",
//         link: "Science-Grade-10-Applied-SNC2P-10",
//       }, //1

//       //SOCIAL SCIENCES AND HUMANITIES START
//       {
//         img: "subject4",
//         title: "Exploring Family Studies, Grade 9 or 10 Open HIF1O/2O",
//         bgColor: "#56CD78",
//         link: "Exploring-Family-Studies-Grade-9-or-10-Open-HIF1O-2O-10",
//       }, //1
//       {
//         img: "subject4",
//         title: "Clothing, Grade 10 Open HNL2O",
//         bgColor: "#56CD78",
//         link: "Clothing-Grade-10-Open-HNL2O-10",
//       }, //1
//       {
//         img: "subject4",
//         title: "Food and Nutrition, Grade 9 or 10  Open HFN1O/2O",
//         bgColor: "#56CD78",
//         link: "Food-and-Nutrition-Grade-9-or-10-Open-HFN1O-2O-10",
//       }, //1

//       //TECHNOLOGY EDUCATION START

//       {
//         img: "subject4",
//         title: "Communications Technology, Grade 10  Open TGJ2O",
//         bgColor: "#B13EE0",
//         link: "Communications-Technology-Grade-10-Open-TGJ2O-10",
//       }, //1

//       {
//         img: "subject4",
//         title: "Computer Technology, Grade 10 Open TEJ2O",
//         bgColor: "#B13EE0",
//         link: "Computer-Technology-Grade-10-Open-TEJ2O-10",
//       },
//       {
//         img: "subject4",
//         title: "Construction Technology, Grade 10 Open TCJ2O",
//         bgColor: "#B13EE0",
//         link: "Construction-Technology-Grade-10-Open-TCJ2O-10",
//       },

//       {
//         img: "subject4",
//         title: "Green Industries, Grade 10 Open THJ2O",
//         bgColor: "#B13EE0",
//         link: "Green-Industries-Grade-10-Open-THJ2O-10",
//       },

//       {
//         img: "subject4",
//         title: "Computer Technology, Grade 10 Open TEJ2O",
//         bgColor: "#B13EE0",
//         link: "Computer-Technology-Grade-10-Open-TEJ2O-10",
//       },

//       {
//         img: "subject4",
//         title: "Hairstyling and Aesthetics,  Grade 10 Open TXJ2O",
//         bgColor: "#B13EE0",
//         link: "Hairstyling-and-Aesthetics-Grade-10-Open-TXJ2O-10",
//       },

//       {
//         img: "subject4",
//         title: "Health Care, Grade 10 Open TPJ2O",
//         bgColor: "#B13EE0",
//         link: "Health-Care-Grade-10-Open-TPJ2O-10",
//       },

//       {
//         img: "subject4",
//         title: "Hospitality and Tourism, Grade 10 Open TFJ2O",
//         bgColor: "#B13EE0",
//         link: "Hospitality-and-Tourism-Grade-10-Open-TFJ2O-10",
//       },

//       {
//         img: "subject4",
//         title: "Manufacturing Technology,Grade 10 Open TMJ2O",
//         bgColor: "#B13EE0",
//         link: "Manufacturing-Technology-Grade-10-Open-TMJ2O-10",
//       },
//       {
//         img: "subject4",
//         title: "Technological Design,   Grade 10 Open TDJ2O",
//         bgColor: "#B13EE0",
//         link: "Technological-Design-Grade-10-Open-TDJ2O-10",
//       },
//       {
//         img: "subject4",
//         title: "Transportation Technology,  Grade 10 Open TTJ2O",
//         bgColor: "#B13EE0",
//         link: "Transportation-Technology-Grade-10-Open-TTJ2O-10",
//       },
//     ],
//     [
//       //ARTS START
//       {
//         img: "subject3",
//         title: "Dance University/College Preparation",
//         bgColor: "#D54041",
//         link: "Dance-University-College-Preparation11 ",
//       },
//       {
//         img: "subject2",
//         title: "Dance - Open",
//         bgColor: "#7A3FF7",
//         link: "Dance-open11 ",
//       },
//       {
//         img: "subject3",
//         title: "Drama University/College Preparation",
//         bgColor: "#D54041",
//         link: "Drama-University-College-Preparation11 ",
//       },
//       {
//         img: "subject3",
//         title: "Drama - Open ",
//         bgColor: "#D54041",
//         link: "Drama-open11 ",
//       },
//       {
//         img: "subject3",
//         title: "Exploring and Creating in the Arts - Open",
//         bgColor: "#D54041",
//         link: "Exploring-and-Creating-in-the-Arts-open11 ",
//       },
//       {
//         img: "subject3",
//         title: "Music University/College Preparation",
//         bgColor: "#D54041",
//         link: "Music-University-College-Preparation11 ",
//       },
//       {
//         img: "subject3",
//         title: "Music - Open ",
//         bgColor: "#D54041",
//         link: "Music-open11 ",
//       },
//       {
//         img: "subject4",
//         title: "Visual Arts - Open",
//         bgColor: "#56CD78",
//         link: "Visual-Arts-open11 ",
//       },
//       {
//         img: "subject4",
//         title: "Visual Arts College/University Preparation",
//         bgColor: "#56CD78",
//         link: "Visual-Arts-University-Preparation11 ",
//       },
//       {
//         img: "subject2",
//         title: "Visual Arts - Open (AVI30)",
//         bgColor: "#7A3FF7",
//         link: "Visual-Arts-open-AVI30-11 ",
//       },
//       {
//         img: "subject2",
//         title: "Media Arts, Grade 11 University/College Preparation ASM3M",
//         bgColor: "#7A3FF7",
//         link: "Media-Arts-Grade-11-University-College-Preparation-ASM3M-11 ",
//       },
//       {
//         img: "subject2",
//         title: "Media Arts, Grade 11  Open ASM3O",
//         bgColor: "#7A3FF7",
//         link: "Media-Arts-Grade-11-Open-ASM3O-11 ",
//       },

//       //FRENCH START

//       {
//         img: "subject2",
//         title: "Core French, Grade 11 University Preparation FSF3U",
//         bgColor: "#7A3FF7",
//         link: "Core-French-Grade-11-University-Preparation-FSF3U",
//       },
//       {
//         img: "subject1",
//         title: "Core French, Grade 11 Open FSF30",
//         bgColor: "#7A3FF7",
//         link: "Core-French-Grade-11-Open-FSF20-11",
//       },
//       {
//         img: "subject1",
//         title: "Extended French, Grade 11 University Preparation",
//         bgColor: "#7A3FF7",
//         link: "Extended-French-Grade-11-University-Preparation",
//       },
//       {
//         img: "subject2",
//         title: "French Immersion, Grade 11 Univeristy Preparation FIF3U",
//         bgColor: "#7A3FF7",
//         link: "French-Immersion-Grade-11-Univeristy-Preparation-FIF3U-11",
//       },
//       {
//         img: "subject1",
//         title: "French Immersion, Grade 11 Open FIF30",
//         bgColor: "#7A3FF7",
//         link: "French-Immersion-Grade-11-Open-FIF30-11",
//       },

//       //MATHS START

//       {
//         img: "subject3",
//         title: "Functions, Grade 11, University Preparation(MCR3U)",
//         bgColor: "#7A3FF7",
//         link: "Functions-Grade 11-University-Preparation-MCR3U",
//       },
//       {
//         img: "subject3",
//         title:
//           "Functions and Applications, Grade 11 University/College Preparation(MCF3M)",
//         bgColor: "#7A3FF7",
//         link: "Functions-And-Applications-Grade-11-University-Preparation-MCF3M",
//       },
//       {
//         img: "subject3",
//         title:
//           "Foundations for College Mathematics, Grade 11 College Preparation MBF3C",
//         bgColor: "#7A3FF7",
//         link: "Foundation-For-College-Mathematics-Grade-11-College-Preparation-MBF3C",
//       },
//       {
//         img: "subject3",
//         title:
//           "Mathematics for Work and Everyday Life, Grade 11  Workplace Preparation MEL3E",
//         bgColor: "#7A3FF7",
//         link: "Mathematics-For-Work-And-Everyday-Life-Grade-11-Workplace-Preparation-MEL3E",
//       },

//       //BUSINESS STUDIES START

//       {
//         img: "subject4",
//         title: "Financial Accounting",
//         bgColor: "#56CD78",
//         link: "Financial-Accounting-11",
//       }, //1
//       {
//         img: "subject4",
//         title: "Accounting Essentials",
//         bgColor: "#56CD78",
//         link: "Accounting-Essentials-11",
//       }, //2
//       {
//         img: "subject4",
//         title: "Enterpreneurship: The Venture",
//         bgColor: "#56CD78",
//         link: "Enterpreneurship-The-Venture-11",
//       }, //3
//       {
//         img: "subject4",
//         title: "Enterpreneurship: The Enterprising Person",
//         bgColor: "#56CD78",
//         link: "Enterpreneurship-The-Enterprising-Person-11",
//       }, //4
//       {
//         img: "subject4",
//         title:
//           "Information and communication Technology: The Digital Environment",
//         bgColor: "#56CD78",
//         link: "Information-and-Communication-Technology-The-Digital-Environment-11",
//       }, //5
//       {
//         img: "subject4",
//         title: "Marketing: Goods Services and Events",
//         bgColor: "#56CD78",
//         link: "Marketing-Goods-Services-and-Events-11",
//       }, //6
//       {
//         img: "subject4",
//         title: "Marketing: Retail and Services",
//         bgColor: "#56CD78",
//         link: "Marketing-Retail-and-Services-11",
//       }, //7

//       //CANADIAN AND WORLD STUDIES START

//       {
//         img: "subject2",
//         title:
//           "The Individual and the Economy, Grade 11 University/College Preparation CIE3M",
//         bgColor: "#7A3FF7",
//         link: "The-Individual-and-the-Economy-Grade-11-University-College-Preparation-CIE3M-11",
//       }, //1
//       {
//         img: "subject2",
//         title: "Introduction to Spatial Technologies, Grade 11 Open CGT3O",
//         bgColor: "#7A3FF7",
//         link: "Introduction-to-Spatial-Technologies-Grade-11-Open-CGT3O-11",
//       }, //2
//       {
//         img: "subject2",
//         title:
//           "Travel and Tourism: A Geographic Perspective, Grade 11 Open CGG3O",
//         bgColor: "#7A3FF7",
//         link: "Travel-and-Tourism-A-Geographic-Perspective-Grade-11-Open-CGG3O-11",
//       }, //3
//       {
//         img: "subject2",
//         title:
//           "Forces of Nature: Physical Processes and Disasters, Grade 11 University/College Preparation CGF3M",
//         bgColor: "#7A3FF7",
//         link: "Forces-of-Nature-Physical-Processes-and-Disasters-Grade-11-University-College-Preparation-CGF3M-11",
//       }, //4
//       {
//         img: "subject2",
//         title:
//           "Regional Geography, Grade 11 University/College Preparation CGD3M",
//         bgColor: "#7A3FF7",
//         link: "Regional-Geography-Grade-11-University-College-Preparation-CGD3M-11",
//       }, //5
//       {
//         img: "subject2",
//         title:
//           "World History since the Fifteenth Century, Grade 12 University Preparation CHY4U",
//         bgColor: "#7A3FF7",
//         link: "World-History-since-the-Fifteenth-Century-Grade-11-University-Preparation-CHY4U-11",
//       }, //6
//       {
//         img: "subject2",
//         title: "Politics in Action: Making Change, Grade 11Open CPC3O",
//         bgColor: "#7A3FF7",
//         link: "Politics-in-Action-Making-Change-Grade-11Open-CPC3O-11",
//       }, //7
//       {
//         img: "subject2",
//         title: "American History, Grade 11 University Preparation CHA3U",
//         bgColor: "#7A3FF7",
//         link: "American-History-Grade-11-University-Preparation-CHA3U-11",
//       }, //8
//       {
//         img: "subject2",
//         title:
//           "Understanding Canadian Law,Grade 11 University/College Preparation CLU3M",
//         bgColor: "#7A3FF7",
//         link: "Understanding-Canadian-Law-Grade-11-University-College-Preparation-CLU3M-11",
//       }, //9
//       {
//         img: "subject2",
//         title:
//           "Understanding Canadian Law in Everyday Life, Grade 11 Workplace Preparation CLU3E",
//         bgColor: "#7A3FF7",
//         link: "Understanding-Canadian-Law-in-Everyday-Life-Grade-11-Workplace-Preparation-CLU3E-11",
//       }, //10
//       {
//         img: "subject2",
//         title:
//           "World History since 1900:Global and Regional Interactions, Grade 11 Open CHT3O",
//         bgColor: "#7A3FF7",
//         link: "World-History-since-1900-Global-and-Regional-Interactions-Grade-11-Open-CHT3O-11",
//       }, //11
//       {
//         img: "subject2",
//         title:
//           "World History to the End of the Fifteenth Century, Grade 11 University/College Preparation CHW3M",
//         bgColor: "#7A3FF7",
//         link: "World-History-to-the-End-of-the-Fifteenth-Century-Grade-11-University-College-Preparation-CHW3M-11",
//       }, //12
//       {
//         img: "subject2",
//         title:
//           "Origins and Citizenship: The History of a Canadian Ethnic Group, Grade 11 Open CHE3O",
//         bgColor: "#7A3FF7",
//         link: "Origins-and-Citizenship-The-History-of-a-Canadian-Ethnic-Group-Grade-11-Open-CHE3O-11",
//       }, //13

//       //CLASSICAL STUDIES AND INTERNATIONAL LANGUAGES 2016 START

//       {
//         img: "subject3",
//         title:
//           "Origins and Citizenship: The History of a Canadian Ethnic Group, Grade 11 Open CHE3O",
//         bgColor: "#D54041",
//         link: "Origins-and-Citizenship-The-History-of-a-Canadian-Ethnic-Group-Grade-11-Open-CHE3O-11",
//       }, //1

//       //COMPTER STUDIES

//       {
//         img: "subject4",
//         title:
//           "Introduction to Computer Science, Grade 11 University Preparation ICS3U",
//         bgColor: "#56CD78",
//         link: "Introduction-to-Computer-Science-Grade-11-University-Preparation-ICS3U-11",
//       }, //1
//       {
//         img: "subject4",
//         title:
//           "Introduction to Computer Programming, Grade 11 College Preparation ICS3C",
//         bgColor: "#56CD78",
//         link: "Introduction-to-Computer-Programming-Grade-11-College-Preparation-ICS3C-11",
//       }, //2

//       //COOPERATIVE EDUCATION START

//       {
//         img: "subject1",
//         title: "Creating Opportunities through Co-op, Grade 11 Open DCO3O",
//         bgColor: "#3bc6df",
//         link: "Creating-Opportunities-through-Co-op-Grade-11-Open-DCO3O-11",
//       }, //1

//       //ENGLISH START

//       {
//         img: "subject1",
//         title: "English, Grade 11 University Preparation ENG3U",
//         bgColor: "#3bc6df",
//         link: "English-Grade-11-University-Preparation-ENG3U-11",
//       }, //1
//       {
//         img: "subject1",
//         title: "English, Grade 11 College Preparation ENG3C",
//         bgColor: "#3bc6df",
//         link: "English-Grade-11-College-Preparation-ENG3C-11",
//       }, //2
//       {
//         img: "subject1",
//         title: "English, Grade 11 Workplace Preparation ENG3E",
//         bgColor: "#3bc6df",
//         link: "English-Grade-11-Workplace-Preparation-ENG3E-11",
//       }, //3
//       {
//         img: "subject1",
//         title:
//           "Canadian Literature, Grade 11 University/College Preparation ETC3M",
//         bgColor: "#3bc6df",
//         link: "Canadian-Literature-Grade-11-University-College-Preparation-ETC3M-11",
//       }, //4
//       {
//         img: "subject1",
//         title: "Media Studies, Grade 11 Open EMS3O",
//         bgColor: "#3bc6df",
//         link: "Media-Studies-Grade-11-Open-EMS3O-11",
//       }, //5

//       //First Nations, Metis Start
//       {
//         img: "subject3",
//         title:
//           "NDA3MGrade 11 Contemporary First Nations, Métis, and Inuit Issues and Perspectives",
//         bgColor: "#3bc6df",
//         link: "NDA3MGrade-11-Contemporary-First-Nations-Metis-and-Inuit-Issues-and-Perspectives-11",
//       }, //1
//       {
//         img: "subject3",
//         title:
//           "NBE3UGrade 11 English: Understanding Contemporary First Nations, Métis, and Inuit Voices",
//         bgColor: "#3bc6df",
//         link: "NBE3UGrade-11-English-Understanding-Contemporary-First-Nations-Metis-and-Inuit-Issues-and-Perspectives-11",
//       }, //2
//       {
//         img: "subject3",
//         title:
//           "NBE3CGrade 11 English: Understanding Contemporary First Nations, Métis, and Inuit Voices",
//         bgColor: "#3bc6df",
//         link: "NBE3CGrade-11-English-Understanding-Contemporary-First-Nations-Metis-and-Inuit-Issues-and-Perspectives-11",
//       }, //3
//       {
//         img: "subject3",
//         title:
//           "NBE3EGrade 11  English: Understanding Contemporary First Nations, Métis, and Inuit Voices",
//         bgColor: "#3bc6df",
//         link: "NBE3EGrade-11-English-Understanding-Contemporary-First-Nations-Metis-and-Inuit-Issues-and-Perspectives-11",
//       }, //4
//       {
//         img: "subject3",
//         title:
//           "NBV3CGrade 11  World Views and Aspirations of First Nations, Métis, and Inuit Communities in Canada",
//         bgColor: "#3bc6df",
//         link: "NBV3CGrade-11-World-Views-and-Aspirations-of-First-Nations-Metis-and-Inuit-Communities-in-Canada-11",
//       }, //5
//       {
//         img: "subject3",
//         title:
//           "NBV3EGrade 11 World Views and Aspirations of First Nations, Métis, and Inuit Communities in Canada",
//         bgColor: "#3bc6df",
//         link: "NBV3EGrade-11-World-Views-and-Aspirations-of-First-Nations-Metis-and-Inuit-Communities-in-Canada-11",
//       }, //6

//       //Guidance And Career Education Start
//       {
//         img: "subject4",
//         title: "Designing Your Future, Grade 11, Open (GWL3O)",
//         bgColor: "#3bc6df",
//         link: "Designing-Your-Future-Grade-11-Open-GWL3O-11",
//       }, //1
//       {
//         img: "subject4",
//         title: "Leadership and Peer Support, Grade 11, Open (GPP3O)",
//         bgColor: "#3bc6df",
//         link: "Leadership-and-Peer-Support-Grade-11-Open-GPP3O-11",
//       }, //2

//       //Health and Physical Education Start
//       {
//         img: "subject4",
//         title: "Healthy Active Living Education, Grade 11 Open PPL3O",
//         bgColor: "#3bc6df",
//         link: "Healthy-Active-Living-Education-Grade-11-Open-PPL3O-11",
//       }, //1
//       {
//         img: "subject4",
//         title: "Health for Life,  Grade 11 College Preparation PPZ3C",
//         bgColor: "#3bc6df",
//         link: "Health-for-Life-Grade-11-College-Preparation-PPZ3C-11",
//       }, //2

//       // interdescplinary Start
//       {
//         img: "subject4",
//         title: "Interdisciplinary Studies, Grade 11, Open (IDC3O/IDP3O)",
//         bgColor: "#3bc6df",
//         link: "Interdisciplinary-Studies-Grade-11-Open-IDC3O-IDP3O-11",
//       }, //1

//       //SCIENCE  Start

//       {
//         img: "subject4",
//         title: "Biology, Grade 11 University Preparation SBI3U",
//         bgColor: "#3bc6df",
//         link: "Biology, Grade 11 University Preparation SBI3U-11",
//       }, //1
//       {
//         img: "subject4",
//         title: "Biology, Grade 11 SBI3C",
//         bgColor: "#3bc6df",
//         link: "Biology, Grade 11 SBI3C-11",
//       }, //2
//       {
//         img: "subject4",
//         title: "Chemistry, Grade 11 University Preparation SCH3U",
//         bgColor: "#3bc6df",
//         link: "Chemistry, Grade 11 University Preparation SCH3U-11",
//       }, //3
//       {
//         img: "subject4",
//         title:
//           "Environmental Science, Grade 11 University/College Preparation SVN3M",
//         bgColor: "#3bc6df",
//         link: "Environmental-Science, Grade 11 University/College Preparation SVN3M-11",
//       }, //4
//       {
//         img: "subject4",
//         title: "Environmental Science, Grade 11 Workplace Preparation SVN3E",
//         bgColor: "#3bc6df",
//         link: "Environmental-Science, Grade 11 Workplace Preparation SVN3E-11",
//       }, //5
//       {
//         img: "subject4",
//         title: "Physics, Grade 11 University Preparation SPH3U",
//         bgColor: "#3bc6df",
//         link: "Physics, Grade 11 University Preparation SPH3U-11",
//       }, //6

//       //SOCIAL SCIENCE Start -14

//       {
//         img: "subject4",
//         title: "Gender Studies, Grade 11 University/College Preparation HSG3M",
//         bgColor: "#3bc6df",
//         link: "Gender-Studies, Grade 11 University/College Preparation HSG3M-11",
//       }, //1
//       {
//         img: "subject4",
//         title: "Understanding Fashion, Grade 11 College Preparation HNC3C",
//         bgColor: "#3bc6df",
//         link: "Understanding-Fashion, Grade 11 College Preparation HNC3C-11",
//       }, //2
//       {
//         img: "subject4",
//         title: "Housing and Home Design,  Grade 11 Open HLS3O",
//         bgColor: "#3bc6df",
//         link: "Housing-and-Home-Design,  Grade 11 Open HLS3O-11",
//       }, //3
//       {
//         img: "subject4",
//         title: "Physics, Grade 11 University Preparation SPH3U",
//         bgColor: "#3bc6df",
//         link: "Physics, Grade 11 University Preparation SPH3U-11",
//       }, //4
//       {
//         img: "subject4",
//         title:
//           "Food and Culture, Grade 11 University/College Preparation HFC3M",
//         bgColor: "#3bc6df",
//         link: "Food-and-Culture, Grade 11 University/College Preparation HFC3M-11",
//       }, //5
//       {
//         img: "subject4",
//         title: "Food and Culture, Grade 11 Workplace Preparation HFC3E ",
//         bgColor: "#3bc6df",
//         link: "Food-and-Culture, Grade 11 Workplace Preparation HFC3E-11",
//       }, //6
//       {
//         img: "subject4",
//         title: "Dynamics of Human Relationships, Grade 11 Open HHD3O ",
//         bgColor: "#3bc6df",
//         link: "Dynamics-of-Human-Relationships, Grade 11 Open HHD3O-11",
//       }, //7
//       {
//         img: "subject4",
//         title:
//           "Working With Infants and Young Children, Grade 11 College Preparation HPW3C",
//         bgColor: "#3bc6df",
//         link: "Working-With-Infants-and-Young-Children, Grade 11 College Preparation HPW3C-11",
//       }, //8
//       {
//         img: "subject4",
//         title: "Raising Healthy Children, Grade 11  Open HPC3O",
//         bgColor: "#3bc6df",
//         link: "Raising-Healthy-Children, Grade 11  Open HPC3O-11",
//       }, //9
//       {
//         img: "subject4",
//         title:
//           "Working With School-Age Children and Adolescents, Grade 12 College Preparation HPD4C",
//         bgColor: "#3bc6df",
//         link: "Working-With-School-Age-Children-and-Adolescents, Grade 12 College Preparation HPD4C-11",
//       }, //10
//       {
//         img: "subject4",
//         title:
//           "Introduction to Anthropology, Psychology, and Sociology Grade 11 College Preparation HSP3C",
//         bgColor: "#3bc6df",
//         link: "Introduction-to-Anthropology, Education, and Sociology Grade 11 College Preparation HSP3C-11",
//       }, //11

//       {
//         img: "subject4",
//         title:
//           "Philosophy: The Big Questions, Grade 11 University/College Preparation HZB3M",
//         bgColor: "#3bc6df",
//         link: "Philosophy: The Big Questions, Grade 11 University/College Preparation HZB3M-11",
//       }, //12
//       {
//         img: "subject4",
//         title:
//           "World Religions and Belief Traditions in Daily Life, Grade 11 Open HRF3O",
//         bgColor: "#3bc6df",
//         link: "World-Religions-and-Belief-Traditions-in-Daily-Life, Grade 11 Open HRF3O-11",
//       }, //13
//       {
//         img: "subject4",
//         title:
//           "Equity, Diversity, and Social Justice,  Grade 11 Workplace Preparation HSE3E",
//         bgColor: "#3bc6df",
//         link: "Equity-Diversity-and-Social-Justice,  Grade 11 Workplace Preparation HSE3E-11",
//       }, //14

//       //TECHNOLOGICAL EDUCATION Start -21
//       {
//         img: "subject4",
//         title:
//           "Communications Technology, Grade 11 University/College Preparation TGJ3M",
//         bgColor: "#3bc6df",
//         link: "Communications-Technology, Grade 11 University/College Preparation TGJ3M-11",
//       }, //1
//       {
//         img: "subject4",
//         title:
//           "Communications Technology: Broadcast and Print Production, Grade 11  Open TGJ3O",
//         bgColor: "#3bc6df",
//         link: "Communications-Technology: Broadcast and Print Production, Grade 11  Open TGJ3O-11",
//       }, //2
//       {
//         img: "subject4",
//         title:
//           "Computer Engineering Technology, Grade 11 University/College Preparation TEJ3M",
//         bgColor: "#3bc6df",
//         link: "Computer-Engineering-Technology, Grade 11 University/College Preparation TEJ3M-11",
//       }, //3
//       {
//         img: "subject4",
//         title: "Computer Technology, Grade 11 Workplace Preparation TEJ3E",
//         bgColor: "#3bc6df",
//         link: "Computer-Technology, Grade 11 Workplace Preparation TEJ3E-11",
//       }, //4
//       {
//         img: "subject4",
//         title:
//           "Construction Engineering Technology, Grade 11 College Preparation TCJ3C",
//         bgColor: "#3bc6df",
//         link: "Construction-Engineering-Technology, Grade 11 College Preparation TCJ3C-11",
//       }, //5
//       {
//         img: "subject4",
//         title: "Construction Technology,Grade 11 Workplace Preparation TCJ3E",
//         bgColor: "#3bc6df",
//         link: "Construction-Technology,Grade 11 Workplace Preparation TCJ3E-11",
//       }, //6
//       {
//         img: "subject4",
//         title: "Custom Woodworking, Grade 11 Workplace Preparation TWJ3E",
//         bgColor: "#3bc6df",
//         link: "Custom-Woodworking, Grade 11 Workplace Preparation TWJ3E-11",
//       }, //7
//       {
//         img: "subject4",
//         title:
//           "Green Industries, Grade 11 University/College Preparation THJ3M",
//         bgColor: "#3bc6df",
//         link: "Green-Industries, Grade 11 University/College Preparation THJ3M-11",
//       }, //8
//       {
//         img: "subject4",
//         title: "Green Industries, Grade 11 Workplace Preparation THJ3E",
//         bgColor: "#3bc6df",
//         link: "Green-Industries, Grade 11 Workplace Preparation THJ3E-11",
//       }, //9
//       {
//         img: "subject4",
//         title:
//           "Hairstyling and Aesthetics,  Grade 11 Workplace Preparation TXJ3E",
//         bgColor: "#3bc6df",
//         link: "Hairstyling-and-Aesthetics,  Grade 11 Workplace Preparation TXJ3E-11",
//       }, //10
//       {
//         img: "subject4",
//         title: "Health Care,Grade 11  University/College Preparation TPJ3M",
//         bgColor: "#3bc6df",
//         link: "Health-Care,Grade 11  University/College Preparation TPJ3M-11",
//       }, //11
//       {
//         img: "subject4",
//         title: "Health Care, Grade 11 College Preparation TPJ3C",
//         bgColor: "#3bc6df",
//         link: "Health-Care, Grade 11 College Preparation TPJ3C-11",
//       }, //12
//       {
//         img: "subject4",
//         title: "Hospitality and Tourism, Grade 11 College Preparation TFJ3C",
//         bgColor: "#3bc6df",
//         link: "Hospitality-and-Tourism, Grade 11 College Preparation TFJ3C-11",
//       }, //13
//       {
//         img: "subject4",
//         title: "Hospitality and Tourism,Grade 11 Workplace Preparation",
//         bgColor: "#3bc6df",
//         link: "Hospitality-and-Tourism,Grade 11 Workplace Preparation-11",
//       }, //14
//       {
//         img: "subject4",
//         title:
//           "Manufacturing Engineering Technology, Grade 11 University/College Preparation TMJ3M",
//         bgColor: "#3bc6df",
//         link: "Manufacturing-Engineering-Technology, Grade 11 University/College Preparation TMJ3M-11",
//       }, //15
//       {
//         img: "subject4",
//         title: "Manufacturing Technology, Grade 11 College Preparation TMJ3C",
//         bgColor: "#3bc6df",
//         link: "Manufacturing-Technology, Grade 11 College Preparation TMJ3C-11",
//       }, //16
//       {
//         img: "subject4",
//         title: "Manufacturing Technology, Grade 11 Workplace Preparation TMJ3E",
//         bgColor: "#3bc6df",
//         link: "Manufacturing-Technology, Grade 11 Workplace Preparation TMJ3E-11",
//       }, //17
//       {
//         img: "subject4",
//         title:
//           "Technological Design, Grade 11 University/College Preparation TDJ3M",
//         bgColor: "#3bc6df",
//         link: "Technological-Design, Grade 11 University/College Preparation TDJ3M-11",
//       }, //18
//       {
//         img: "subject4",
//         title: "Technological Design and the Environment, Grade 11  Open TDJ3O",
//         bgColor: "#3bc6df",
//         link: "Technological-Design-and-the-Environment, Grade 11  Open TDJ3O-11",
//       }, //19
//       {
//         img: "subject4",
//         title: "Transportation Technology,  Grade 11 College Preparation TTJ3C",
//         bgColor: "#3bc6df",
//         link: "Transportation-Technology,  Grade 11 College Preparation TTJ3C-11",
//       }, //20
//       {
//         img: "subject4",
//         title:
//           "Transportation Technology: Vehicle Ownership, Grade 11 Open TTJ3O",
//         bgColor: "#3bc6df",
//         link: "Transportation-Technology: Vehicle Ownership, Grade 11 Open TTJ3O-11",
//       }, //21
//     ],
//     [
//       //ARTS START
//       {
//         img: "subject3",
//         title: "Dance University/College Preparation",
//         bgColor: "#D54041",
//         link: "Dance-University-College-Preparation12 ",
//       },
//       {
//         img: "subject2",
//         title: "Dance Workplace Preparation",
//         bgColor: "#D54041",
//         link: "Dance-Workplace-Preparation12",
//       },
//       {
//         img: "subject3",
//         title: "Drama University/College Preparation",
//         bgColor: "#D54041",
//         link: "Drama-University-College-Preparation12 ",
//       },
//       {
//         img: "subject3",
//         title: "Drama Workplace Preparation ",
//         bgColor: "#D54041",
//         link: "Drama-Workplace-Preparation12",
//       },
//       {
//         img: "subject3",
//         title: "Music University/College Preparation",
//         bgColor: "#D54041",
//         link: "Music-University-College-Preparation12",
//       },
//       {
//         img: "subject3",
//         title: "Music Workplace Preparation ",
//         bgColor: "#D54041",
//         link: "Music-Workplace-Preparation12",
//       },
//       {
//         img: "subject4",
//         title: "Visual Arts College/University Preparation",
//         bgColor: "#D54041",
//         link: "Visual-Arts-University-Preparation12 ",
//       },
//       {
//         img: "subject2",
//         title: "Visual Arts - Open (AVI4E)",
//         bgColor: "#D54041",
//         link: "Visual-Arts-open-AVI4E-12",
//       },
//       {
//         img: "subject2",
//         title: "Media Arts, Grade 11 University/College Preparation ASM4M",
//         bgColor: "#7A3FF7",
//         link: "Media-Arts-Grade-11-University-College-Preparation-ASM4M-12",
//       },
//       {
//         img: "subject2",
//         title: "Media Arts, Grade 12 Workplace Preparation ASM4E",
//         bgColor: "#7A3FF7",
//         link: "Media-Arts-Grade-11-Workplace-Preparation-ASM4E-11 ",
//       },
//       {
//         img: "subject2",
//         title: "Exploring and Creating in the Arts - Grade 12 Open AEA40",
//         bgColor: "#7A3FF7",
//         link: "Exploring-and-Creating-in-the-Arts-Grade-12-Open-AEA40",
//       },

//       //FRENCH START

//       {
//         img: "subject2",
//         title: "Core French, Grade 12 University Preparation FSF4U",
//         bgColor: "#56CD78",
//         link: "Core-French-Grade-12-University-Preparation-FSF4U",
//       },
//       {
//         img: "subject1",
//         title: "Core French, Grade 12 Open FSF40",
//         bgColor: "#56CD78",
//         link: "Core-French-Grade-12-Open-FSF40-12",
//       },
//       {
//         img: "subject1",
//         title: "Extended French, Grade 12 University Preparation FEF4U",
//         bgColor: "#56CD78",
//         link: "Extended-French-Grade-12-University-Preparation-FEF4U",
//       },
//       {
//         img: "subject2",
//         title: "French Immersion, Grade 12 Univeristy Preparation FIF4U",
//         bgColor: "#56CD78",
//         link: "French-Immersion-Grade-12-Univeristy-Preparation-FIF4U-12",
//       },
//       {
//         img: "subject1",
//         title: "French Immersion, Grade 12 Open FIF40",
//         bgColor: "#56CD78",
//         link: "French-Immersion-Grade-12-Open-FIF40-12",
//       },

//       //MATHS START

//       {
//         img: "subject2",
//         title: "Advanced Functions, Grade 12 University Preparation MHF4U",
//         bgColor: "#7A3FF7",
//         link: "Advanced-Functions-Grade 12-University-Preparation-MHF4U",
//       },
//       {
//         img: "subject3",
//         title: "Calculus and Vectors, Grade 12 University Preparation MCV4U",
//         bgColor: "#7A3FF7",
//         link: "Calculus-And-Vectors-Grade-12-University-Preparation-MCV4U",
//       },
//       {
//         img: "subject1",
//         title:
//           "Mathematics of Data Management, Grade 12 University Preparation MDM4U",
//         bgColor: "#7A3FF7",
//         link: "Mathematics-Of-Data-Management-Grade-12-University-Preparation-MDM4U",
//       },
//       {
//         img: "subject1",
//         title:
//           "Mathematics for College Technology, Grade 12 College Preparation MCT4C",
//         bgColor: "#7A3FF7",
//         link: "Mathematics-For-College-Technology-Grade-12-College-Preparation-MCT4C",
//       },
//       {
//         img: "subject1",
//         title:
//           "Foundations for College Mathematics, Grade 12  College Preparation MAP4C",
//         bgColor: "#7A3FF7",
//         link: "Foundations-For-College-Mathematics-Grade-12-College-Preparation-MAP4C",
//       },
//       {
//         img: "subject1",
//         title:
//           "Mathematics for Work and Everyday Life, Grade 12 Workplace Preparation MEL4E",
//         bgColor: "#7A3FF7",
//         link: "Mathematics-For-Work-and-And-Everyday-Grade-12-Workplace-Preparation-MEL4E",
//       },
//       //BUSINESS STUDIES 2006
//       {
//         img: "subject2",
//         title: "Financial Accounting Principles",
//         bgColor: "#b612e3",
//         link: "financial-accounting-principles-12",
//       },
//       {
//         img: "subject2",
//         title: "Accounting For Small Business",
//         bgColor: "#b612e3",
//         link: "accounting-for-small-business-12",
//       },
//       {
//         img: "subject2",
//         title: "Entrepreneurship: Venture Plaining in an Electronic Age",
//         bgColor: "#b612e3",
//         link: "entrepreneurship-venture-plaining-in-an-electronic-age-12",
//       },
//       {
//         img: "subject2",
//         title: "Information and communication technology :Multimedia solutions",
//         bgColor: "#b612e3",
//         link: "information-and-communication-technology-multimedia-solutions-12",
//       },
//       {
//         img: "subject2",
//         title: "Information and communication technology in the workplace",
//         bgColor: "#b612e3",
//         link: "information-and-communication-technology-in-the-workplace-12",
//       },
//       {
//         img: "subject2",
//         title: "international business fundamentals",
//         bgColor: "#b612e3",
//         link: "international-business-fundamentals-12",
//       },
//       {
//         img: "subject2",
//         title: "international business essentials",
//         bgColor: "#b612e3",
//         link: "international-business-essentials-12",
//       },
//       {
//         img: "subject2",
//         title: "Business leadership : management fundamentals",
//         bgColor: "#b612e3",
//         link: "business-leadership-management-fundamentals-12",
//       },

//       {
//         img: "subject2",
//         title: "Business leadership : becoming a manager",
//         bgColor: "#b612e3",
//         link: "business-leadership-becoming-a-manager-12",
//       },

//       //CANADIAN AND WORLD STUDIES

//       {
//         img: "subject2",
//         title:
//           "Living in a Sustainable World, Grade 12 Workplace Preparation CGR4E",
//         bgColor: "#e3b912",
//         link: "living-in-a-sustainable-world-grade-12-workplace-preparation-CGR4E-12",
//       },
//       {
//         img: "subject2",
//         title:
//           "World Issues: A Geographic Analysis, Grade 12  College Preparation CGW4C",
//         bgColor: "#e3b912",
//         link: "world-issues-a-geographic-analysis-grade-12-college-preparation-CGW4C-12",
//       },
//       {
//         img: "subject2",
//         title:
//           "Analysing Current Economic Issues, Grade 12 University Preparation CIA4U",
//         bgColor: "#e3b912",
//         link: "analysing-current-economic-issues-grade-12-university-preparation-CIA4U-12",
//       },
//       {
//         img: "subject2",
//         title:
//           "World Issues: A Geographic Analysis, Grade 12 University Preparation CGW4U",
//         bgColor: "#e3b912",
//         link: "world-issues-a-geographic-analysis-grade-12-university-preparation-CGW4U-12",
//       },
//       {
//         img: "subject2",
//         title:
//           "The Environment and Resource Management, Grade 12 University/College Preparation CGR4M",
//         bgColor: "#e3b912",
//         link: "the-environment-and-resource-management-grade-12-university-college-preparation-CGR4M-12",
//       },
//       {
//         img: "subject2",
//         title:
//           "Making Personal Economic Choices, Grade 12 Workplace Preparation CIC4E",
//         bgColor: "#e3b912",
//         link: "making-personal-economic-choices-grade-12-workplace-preparation-CIC4E-12",
//       },
//       {
//         img: "subject2",
//         title:
//           "Spatial Technologies in Action, Grade 12 University/College Preparation CGO4M",
//         bgColor: "#e3b912",
//         link: "spatial-technologies-in-action-grade-12-university-college-preparation-CGO4M-12",
//       },

//       {
//         img: "subject2",
//         title:
//           "World Geography: Urban Patterns and Population Issues, Grade 12  University/College Preparation CGU4M",
//         bgColor: "#e3b912",
//         link: "world-geography-urban-patterns-and-population-issues-grade-12-university-college-preparation-CGU4M-12",
//       },
//       {
//         img: "subject2",
//         title:
//           "World History since the   Fifteenth Century, Grade 12  College Preparation CHY4C",
//         bgColor: "#e3b912",
//         link: "world-history-since-the-fifteenth-century-grade-12-college-preparation-CHY4C-12",
//       },
//       {
//         img: "subject2",
//         title:
//           "Canada: History, Identity, and Culture, Grade 12 University Preparation CHI4U  ",
//         bgColor: "#e3b912",
//         link: "canada-history-identity-and-culture-grade-12-university-preparation-CHI4U-12",
//       },
//       {
//         img: "subject2",
//         title:
//           "Adventures in World History,  Grade 12 Workplace Preparation CHM4E",
//         bgColor: "#e3b912",
//         link: "adventures-in-world-history-grade-12-workplace-preparation-CHM4E-12",
//       },

//       {
//         img: "subject2",
//         title:
//           "Canadian and International Law, Grade 12 University Preparation CLN4U",
//         bgColor: "#e3b912",
//         link: "canadian-and-international-law-grade-12-university-preparation-CLN4U-12",
//       },

//       {
//         img: "subject2",
//         title: "Legal Studies, Grade 12 College Preparation CLN4C ",
//         bgColor: "#e3b912",
//         link: "legal-studies-grade-12-college-preparation-CLN4C-12",
//       },
//       //CLASSICAL STUDIES AND INTERNATIONAL LANGUAGES 2016 START

//       {
//         img: "subject3",
//         title: "Classical Civilization, Grade 12 University Preparation LVV4U",
//         bgColor: "#D54041",
//         link: "classical-civilization-grade-12-university-preparation-LVV4U-12",
//       }, //1

//       //COMPTER STUDIES

//       {
//         img: "subject3",
//         title: "Computer Science, Grade 12 University Preparation ICS4U",
//         bgColor: "#D54041",
//         link: "computer-science-grade-12-university-preparation-ICS4U-12",
//       }, //1
//       {
//         img: "subject3",
//         title: "Computer Programming, Grade 12 College Preparation ICS4C",
//         bgColor: "#D54041",
//         link: "computer-programming-grade-12-college-preparation-ICS4C-12",
//       }, //2

//       //ENGLISH START

//       {
//         img: "subject3",
//         title: "Ontario Secondary School Literacy Course, Grade 12 (OLC4O) ",
//         bgColor: "#D54041",
//         link: "ontario-secondary-school-literacy-course-grade-12-OLC4O-12",
//       }, //1
//       {
//         img: "subject3",
//         title: "The Writer’s Craft, Grade 12  College Preparation EWC4C",
//         bgColor: "#D54041",
//         link: "the-writers-craft-grade-12-college-preparation-EWC4C-12",
//       }, //2
//       {
//         img: "subject3",
//         title: "English, Grade 12  University Preparation ENG4U",
//         bgColor: "#D54041",
//         link: "english-grade-12-university-preparation-ENG4U-12",
//       }, //3
//       {
//         img: "subject3",
//         title: "English, Grade 12 College Preparation ENG4C",
//         bgColor: "#D54041",
//         link: "english-grade-12-college-preparation-ENG4C-12",
//       }, //4
//       {
//         img: "subject3",
//         title: "English, Grade 12 Workplace Preparation ENG4E",
//         bgColor: "#D54041",
//         link: "english-grade-12-workplace-preparation-ENG4E-12",
//       }, //5
//       {
//         img: "subject3",
//         title: "Business and Technological Communication , Grade 12 Open EBT4O",
//         bgColor: "#D54041",
//         link: "business-and-technological-communication-grade-12-open-EBT4O-12",
//       }, //6
//       {
//         img: "subject3",
//         title: "Studies in Literature, Grade 12 University Preparation ETS4U",
//         bgColor: "#D54041",
//         link: "studies-in-literature-grade-12-university-preparation-ETS4U-12",
//       }, //7
//       {
//         img: "subject3",
//         title: "Studies in Literature, Grade 12 College Preparation ETS4C",
//         bgColor: "#D54041",
//         link: "studies-in-literature-grade-12-college-preparation-ETS4C-12",
//       }, //8
//       {
//         img: "subject3",
//         title: "The Writer’s Craft, Grade 12 University Preparation EWC4U",
//         bgColor: "#D54041",
//         link: "the-writers-craft-grade-12-university-preparation-EWC4U-12",
//       }, //9

//       //FIRST NATIONS, METIS START
//       {
//         img: "subject1",
//         title:
//           "NDW4MGrade 12 Contemporary Indigenous Issues and Perspectives in a Global Context",
//         bgColor: "#D54041",
//         link: "ndw4mgrade-12-contemporary-indigenous-issues-and-perspectives-in-a-global-context-12",
//       }, //1
//       {
//         img: "subject1",
//         title:
//           "NDG4MGrade 12 First Nations, Métis, and Inuit Governance in Canada",
//         bgColor: "#D54041",
//         link: "ndg4mgrade-12-first-nations-minis-and-inuit-governance-in-canada-12",
//       }, //2

//       //GUIDANCE AND CAREER EDUCATION START
//       {
//         img: "subject1",
//         title:
//           "Advanced Learning Strategies: (GLS4O/GLE4O/GLE3O) Skills for Success After Secondary School, Grade 12, Open",
//         bgColor: "#D54041",
//         link: "advanced-learning-strategies-gls4o-gle4o-gle3o-skills-for-success-after-secondary-school-grade-12",
//       }, //1
//       {
//         img: "subject1",
//         title:
//           "Advanced Learning Strategies: (GLS4O/GLE4O/GLE3O) Skills for Success After Secondary School, Grade 12, Open",
//         bgColor: "#D54041",
//         link: "advanced-learning-strategies-gls4o-gle4o-gle3o-skills-for-success-after-secondary-school-grade-12",
//       }, //2
//       {
//         img: "subject1",
//         title: "Navigating the Workplace, Grade 12, Open (GLN4O) ",
//         bgColor: "#D54041",
//         link: "navigating-the-workplace-grade-12",
//       }, //3

//       //HEALTH AND PHYSICAL EDUCATION START
//       {
//         img: "subject1",
//         title: "Healthy Active Living Education,Grade 12 Open PPL4O",
//         bgColor: "#D54041",
//         link: "healthy-active-living-education-grade-12-open-PPL4O-12",
//       }, //1
//       {
//         img: "subject1",
//         title:
//           "Introductory Kinesiology, Grade 12 University Preparation PSK4U",
//         bgColor: "#D54041",
//         link: "introductory-kinesiology-grade-12-university-preparation-PSK4U-12",
//       }, //2
//       {
//         img: "subject1",
//         title:
//           "Recreation and Healthy Active Living Leadership, Grade 12 University/College Preparation PLF4M ",
//         bgColor: "#D54041",
//         link: "recreation-and-healthy-active-living-leadership-grade-12-university-college-preparation-PLF4M-12",
//       }, //3

//       //INTERDISCIPLINARY START
//       {
//         img: "subject1",
//         title:
//           "Interdisciplinary Studies, (IDC4U/IDP4U) Grade 12, University Preparation",
//         bgColor: "#D54041",
//         link: "interdisciplinary-studies-grade-12-university-preparation-IDC4U-12",
//       }, //1
//       {
//         img: "subject1",
//         title: "Interdisciplinary Studies, Grade 12, Open (IDC4O/IDP4O)",
//         bgColor: "#D54041",
//         link: "interdisciplinary-studies-grade-12-open-IDC4O-12",
//       }, //2

//       //SCIENCE START
//       {
//         img: "subject3",
//         title: "Biology, Grade 12 University Preparation SBI4U",
//         bgColor: "#D54041",
//         link: "biology-grade-12-university-preparation-SBI4U-12",
//       }, //1
//       {
//         img: "subject3",
//         title: "Chemistry, Grade 12 University Preparation SCH4U",
//         bgColor: "#D54041",
//         link: "chemistry-grade-12-university-preparation-SCH4U-12",
//       }, //2
//       {
//         img: "subject1",
//         title: "Chemistry, Grade 12 College Preparation SCH4C",
//         bgColor: "#D54041",
//         link: "chemistry-grade-12-college-preparation-SCH4C-12",
//       }, //3
//       {
//         img: "subject1",
//         title: "Earth and Space Science, Grade 12 University Preparation SES4U",
//         bgColor: "#D54041",
//         link: "earth-and-space-science-grade-12-university-preparation-SES4U-12",
//       }, //4
//       {
//         img: "subject1",
//         title: "Physics, Grade 12 University Preparation SPH4U",
//         bgColor: "#D54041",
//         link: "physics-grade-12-university-preparation-SPH4U-12",
//       }, //5
//       {
//         img: "subject1",
//         title: "Physics, Grade 12 College Preparation SPH4C",
//         bgColor: "#D54041",
//         link: "physics-grade-12-college-preparation-SPH4C-12",
//       }, //6
//       {
//         img: "subject1",
//         title: "Science, Grade 12 University/College Preparation SNC4M",
//         bgColor: "#D54041",
//         link: "science-grade-12-university-college-preparation-SNC4M-12",
//       }, //7
//       {
//         img: "subject1",
//         title: "Science, Grade 12  Workplace Preparation SNC4E",
//         bgColor: "#D54041",
//         link: "science-grade-12-workplace-preparation-SNC4E-12",
//       }, //8

//       //SOCIAL SCIENCE AND HUMANITIES START
//       {
//         img: "subject3",
//         title: "World Cultures, Grade 12 University/College Preparation HSC4M",
//         bgColor: "#D54041",
//         link: "world-cultures-grade-12-university-college-preparation-HSC4M-12",
//       }, //1
//       {
//         img: "subject3",
//         title:
//           "The World of Fashion,Grade 12 University/College Preparation HNB4M",
//         bgColor: "#D54041",
//         link: "the-world-of-fashion-grade-12-university-college-preparation-HNB4M-12",
//       }, //2
//       {
//         img: "subject1",
//         title: "Nutrition and Health,  Grade 12 University Preparation HFA4U ",
//         bgColor: "#D54041",
//         link: "nutrition-and-health-grade-12-university-preparation-HFA4U-12",
//       }, //3
//       {
//         img: "subject1",
//         title: "Nutrition and Health, Grade 12 College Preparation HFA4C",
//         bgColor: "#D54041",
//         link: "nutrition-and-health-grade-12-college-preparation-HFA4C-12",
//       }, //4
//       {
//         img: "subject1",
//         title: "Food and Healthy Living, Grade 12 Workplace Preparation HFL4E",
//         bgColor: "#D54041",
//         link: "food-and-healthy-living-grade-12-workplace-preparation-HFL4E-12",
//       }, //5
//       {
//         img: "subject1",
//         title: "Families in Canada, Grade 12 University Preparation HHS4U",
//         bgColor: "#D54041",
//         link: "families-in-canada-grade-12-university-preparation-HHS4U-12",
//       }, //6
//       {
//         img: "subject1",
//         title: "Families in Canada,Grade 12 College Preparation HHS4C",
//         bgColor: "#D54041",
//         link: "families-in-canada-grade-12-college-preparation-HHS4C-12",
//       }, //7
//       {
//         img: "subject1",
//         title:
//           "Human Development throughout the Lifespan,  Grade 12  University/College Preparation HHG4M",
//         bgColor: "#D54041",
//         link: "human-development-throughout-the-lifespan-grade-12-university-college-preparation-HHG4M-12",
//       }, //8
//       {
//         img: "subject1",
//         title: "Personal Life Management, Grade 12 Open HIP4O",
//         bgColor: "#D54041",
//         link: "personal-life-management-grade-12-open-HIP4O-12",
//       }, //9
//       {
//         img: "subject1",
//         title:
//           "Challenge and Change in Society,Grade 12 University Preparation HSB4U",
//         bgColor: "#D54041",
//         link: "challenge-and-change-in-society-grade-12-university-preparation-HSB4U-12",
//       }, //10
//       {
//         img: "subject1",
//         title:
//           "Philosophy: Questions and Theories, Grade 12   University Preparation	 HZT4U",
//         bgColor: "#D54041",
//         link: "philosophy-questions-and-theories-grade-12-university-preparation-HZT4U-12",
//       }, //11
//       {
//         img: "subject1",
//         title:
//           "Equity and Social Justice: From Theory to Practice, Grade 12 University/College Preparation HSE4M",
//         bgColor: "#D54041",
//         link: "equity-and-social-justice-from-theory-to-practice-grade-12-university-college-preparation-HSE4M-12",
//       }, //12

//       //TECHNOLOGICAL EDUCATION START
//       {
//         img: "subject3",
//         title:
//           "Communications Technology,Grade 12 University/College Preparation TGJ4M",
//         bgColor: "#D54041",
//         link: "communications-technology-grade-12-university-college-preparation-TGJ4M-12",
//       }, //1
//       {
//         img: "subject3",
//         title:
//           "Communications Technology: Digital Imagery and Web Design, Grade 12  Open TGJ4O",
//         bgColor: "#D54041",
//         link: "communications-technology-digital-imagery-and-web-design-grade-12-open-TGJ4O-12",
//       }, //2
//       {
//         img: "subject1",
//         title:
//           "Computer Engineering Technology, Grade 12  University/College Preparation TEJ4M",
//         bgColor: "#D54041",
//         link: "computer-engineering-technology-grade-12-university-college-preparation-TEJ4M-12",
//       }, //3
//       {
//         img: "subject1",
//         title: "Computer Technology, Grade 12   Workplace Preparation TEJ4E",
//         bgColor: "#D54041",
//         link: "computer-technology-grade-12-workplace-preparation-TEJ4E-12",
//       }, //4
//       {
//         img: "subject1",
//         title:
//           "Construction Engineering  Technology, Grade 12 College Preparation TCJ4C",
//         bgColor: "#D54041",
//         link: "construction-engineering-technology-grade-12-college-preparation-TCJ4C-12",
//       }, //5
//       {
//         img: "subject1",
//         title: "Construction Technology, Grade 12 Workplace Preparation TCJ4E",
//         bgColor: "#D54041",
//         link: "construction-technology-grade-12-workplace-preparation-TCJ4E-12",
//       }, //6
//       {
//         img: "subject1",
//         title: "Custom Woodworking, Grade 12 Workplace Preparation TWJ4E",
//         bgColor: "#D54041",
//         link: "custom-woodworking-grade-12-workplace-preparation-TWJ4E-12",
//       }, //7
//       {
//         img: "subject1",
//         title:
//           "Green Industries, Grade 12 University/College Preparation THJ4M",
//         bgColor: "#D54041",
//         link: "green-industries-grade-12-university-college-preparation-THJ4M-12",
//       }, //8
//       {
//         img: "subject1",
//         title: "Green Industries, Grade 12 Workplace Preparation THJ4E",
//         bgColor: "#D54041",
//         link: "green-industries-grade-12-workplace-preparation-THJ4E-12",
//       }, //9
//       {
//         img: "subject1",
//         title:
//           "Hairstyling and Aesthetics,Grade 12   Workplace Preparation TXJ4E",
//         bgColor: "#D54041",
//         link: "hairstyling-and-aesthetics-grade-12-workplace-preparation-TXJ4E-12",
//       }, //10
//       {
//         img: "subject1",
//         title: "Health Care, Grade 12 University/College Preparation TPJ4M",
//         bgColor: "#D54041",
//         link: "health-care-grade-12-university-college-preparation-TPJ4M-12",
//       }, //11
//       {
//         img: "subject1",
//         title: "Health Care, Grade 12 College Preparation TPJ4C",
//         bgColor: "#D54041",
//         link: "health-care-grade-12-college-preparation-TPJ4C-12",
//       }, //12
//       {
//         img: "subject1",
//         title:
//           "Child Development and Gerontology, Grade 12 College Preparation TOJ4C",
//         bgColor: "#D54041",
//         link: "child-development-and-gerontology-grade-12-college-preparation-TOJ4C-12",
//       }, //13
//       {
//         img: "subject1",
//         title:
//           "Health Care: Support Services, Grade 12 Workplace Preparation TPJ4E",
//         bgColor: "#D54041",
//         link: "health-care-support-services-grade-12-workplace-preparation-TPJ4E-12",
//       }, //14
//       {
//         img: "subject1",
//         title: "Hospitality and Tourism,  Grade 12 College Preparation TFJ4C",
//         bgColor: "#D54041",
//         link: "hospitality-and-tourism-grade-12-college-preparation-TFJ4C-12",
//       }, //15
//       {
//         img: "subject1",
//         title: "Hospitality and Tourism, Grade 12  Workplace Preparation TFJ4E",
//         bgColor: "#D54041",
//         link: "hospitality-and-tourism-grade-12-workplace-preparation-TFJ4E-12",
//       }, //16
//       {
//         img: "subject1",
//         title:
//           "Manufacturing EngineeringTechnology, Grade 12 University/College Preparation TMJ4M",
//         bgColor: "#D54041",
//         link: "manufacturing-engineeringtechnology-grade-12-university-college-preparation-TMJ4M-12",
//       }, //17
//       {
//         img: "subject1",
//         title: "Manufacturing Technology,  Grade 12 College Preparation TMJ4C",
//         bgColor: "#D54041",
//         link: "manufacturing-technology-grade-12-college-preparation-TMJ4C-12",
//       }, //18
//       {
//         img: "subject1",
//         title:
//           "Manufacturing Technology,  Grade 12  Workplace Preparation TMJ4E",
//         bgColor: "#D54041",
//         link: "manufacturing-technology-grade-12-workplace-preparation-TMJ4E-12",
//       }, //19
//       {
//         img: "subject1",
//         title:
//           "Technological Design, Grade 12 University/College Preparation TDJ4M",
//         bgColor: "#D54041",
//         link: "technological-design-grade-12-university-college-preparation-TDJ4M-12",
//       }, //20
//       {
//         img: "subject1",
//         title:
//           "Technological Design in the  Twenty-first Century, Grade 12 Open TDJ4O",
//         bgColor: "#D54041",
//         link: "technological-design-in-the-twenty-first-century-grade-12-open-TDJ4O-12",
//       }, //21
//       {
//         img: "subject1",
//         title: "Transportation Technology, Grade 12 College Preparation TTJ4C",
//         bgColor: "#D54041",
//         link: "transportation-technology-grade-12-college-preparation-TTJ4C-12",
//       }, //22
//       {
//         img: "subject1",
//         title:
//           "Transportation Technology: Vehicle Maintenance, Grade 12 Workplace Preparation TTJ4E",
//         bgColor: "#D54041",
//         link: "transportation-technology-vehicle-maintenance-grade-12-workplace-preparation-TTJ4E-12",
//       }, //23
//     ],
// ];
//     ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(
//     async (item, i) => {
        
//       // await (new gradeModel({grade:i})).save()
//       const g = await gradeModel.findOne({ grade: item });
      
//       subjects[i].map(async (item2) => {
//         await subjectModel.findOneAndUpdate({
//             name: item2.title,
//             grade: g._id,
//         },{
//             image: item2.title.split(" ")[0].toLowerCase()+".png",

//         },{upsert:true})
//         // await new subjectModel({
//         //   name: item2.title,
//         //   grade: g._id,
//         //   image: item2.title.split(" ")[0].toLowerCase()+".png",
//         // }).save();
//       })
//     }
//   );
// };
// const adddata = () => {
//   // registerAdmin()
// //   addgrades()
// };
// module.exports = adddata;
