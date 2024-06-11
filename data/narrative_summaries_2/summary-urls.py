import httplib2

from bs4 import BeautifulSoup, SoupStrainer
import requests

summary_urls = ['https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/abu-sayyaf-group', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-itihaad-al-islamiya/aiai', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/egyptian-islamic-jihad', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-qaida', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-rashid-trust', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/armed-islamic-group', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/asbat-al-ansar', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/harakat-ul-mujahidin/hum', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/islamic-army-of-aden', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/islamic-movement-of-uzbekistan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/libyan-islamic-fighting-group', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/makhtab-al-khidamat', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/the-organization-of-al-qaida-in-the-islamic', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/wafa-humanitarian-organization', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/jaish-i-mohammed', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/jam%E2%80%99yah-ta%E2%80%99awun-al-islamia', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/rabita-trust', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/ummah-tameer-e-nau-%28utn%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/afghan-support-committee-%28asc%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/revival-of-islamic-heritage-society', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/eastern-turkistan-islamic-movement', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/moroccan-islamic-combatant-group', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/tunisian-combatant-group', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/global-relief-foundation-%28grf%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/jemaah-islamiyah', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/benevolence-international-foundation', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/lashkar-i-jhangvi-%28lj%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/ansar-al-islam', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/islamic-international-brigade-%28iib%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/riyadus-salikhin-reconnaissance-and-sabotage', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/special-purpose-islamic-regiment-%28spir%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramain-foundation-%28pakistan%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramayn-foundation-%28kenya%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramayn-foundation-%28tanzania%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-furqan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/taibah-international-bosnia-offices', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramain-%26-al-masjed-al-aqsa-charity-foundation', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramain%3A-afghanistan-branch', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramain%3A-albania-branch', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramain%3A-bangladesh-branch', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramain%3A-ethiopia-branch', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramain%3A-the-netherlands-branch', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-qaida-in-iraq', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-haramain-foundation-%28union-of-the-comoros%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/lashkar-e-tayyiba', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/islamic-jihad-group', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-akhtar-trust-international', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/rajah-solaiman-movement', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-qaida-in-the-arabian-peninsula-%28aqap%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/harakat-ul-jihad-islami', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/emarat-kavkaz', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/tehrik-e-taliban-pakistan-%28ttp%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/jemmah-anshorut-tauhid', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/mouvement-pour-l%E2%80%99unification-et-le-jihad-en', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/ansar-eddine', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/muhammad-jamal-network-%28mjn%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-nusrah-front-for-the-people-of-the-levant', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/jama%27atu-ahlis-sunna-lidda%27awati-wal-jihad-%28boko', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-mouakaoune-biddam', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-moulathamoun', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-mourabitoun', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/ansarul-muslimina-fi-biladis-sudan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/ansar-al-shari%E2%80%99a-in-tunisia-%28aas-t%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/abdallah-azzam-brigades-%28aab%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/ansar-al-charia-derna', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/ansar-al-charia-benghazi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/hilal-ahmar-society-indonesia-%28hasi%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/the-army-of-migrants-and-supporters', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/harakat-sham-al-islam', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/mujahidin-indonesian-timur-%28mit%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/jund-al-khilafah-in-algeria', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/jamaat-ul-ahrar-%28jua%29', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/hanifa-money-exchange-office-%28branch-located-in', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/selselat-al-thahab', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/jaysh-khalid-ibn-al-waleed', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/jund-al-aqsa', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/al-kawthar-money-exchange', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/entity/khatiba-imam-al-bukhari-%28kib%29', 'https://www.un.org/securitycouncil/content/jamaa-nusrat-ul-islam-wa-al-muslimin-jnim', 'https://www.un.org/securitycouncil/content/tariq-gidar-group-tgg', 'https://www.un.org/securitycouncil/content/islamic-state-iraq-and-levant-khorasan-isil-k', 'https://www.un.org/securitycouncil/content/islamic-state-west-africa-province-iswap-0', 'https://www.un.org/securitycouncil/content/islamic-state-greater-sahara-isgs', 'https://www.un.org/securitycouncil/content/jamaah-ansharut-daulah', 'https://www.un.org/securitycouncil/content/islamic-state-iraq-and-levant-libya', 'https://www.un.org/securitycouncil/content/islamic-state-iraq-and-levant-yemen', 'https://www.un.org/securitycouncil/content/jund-al-khilafah-tunisia', 'https://www.un.org/securitycouncil/content/khatiba-al-tawhid-wal-jihad-ktj', 'https://www.un.org/securitycouncil/content/islamic-state-iraq-and-levant-south-east-asia-isil-sea-isil-south-east-asia', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/sayf-al-adl', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/amin-muhammad-ul-haq-saam-khan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/salim-ahmad-salim-hamdan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/aiman-muhammed-rabi-al-zawahiri', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/bilal-bin-marwan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/nashwan-abd-al-razzaq-abd-al-baqi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/tariq-anwar-el-sayed-ahmed', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mahfouz-ould-al-walid', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/tharwat-salah-shihata', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdul-manan-agha', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdullah-ahmed-abdullah-el-alfi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohammad-hamdi-mohammad-sadiq-al-ahdal', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ahmed-khalfan-ghailani', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ri%E2%80%99ad-muhammad-hasan-muhammad-hijazi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/omar-mahmoud-uthman', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdul-rahman-yasin', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hassan-dahir-aweys', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/majeed-abdul-chaudhry', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mahmood-sultan-bashir-ud-din', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohammed-tufail', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ibrahim-ali-abu-bakr-tantoush', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abu-bakr-al-jaziri', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/khalid-abd-al-rahman-hamd-al-fawaz', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohamed-ben-belgacem-ben-abdallah-al-aouadi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohamed-lakhal', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/sami-ben-khamis-ben-saleh-elsseid', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abd-el-kader-mahmoud-mohamed-el-sayed', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mostafa-kamel-mostafa-ibrahim', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/adel-ben-al-azhar-ben-youssef-hamdi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/yassine-chekkouri', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mehdi-ben-mohamed-ben-mohamed-kammoun', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/tarek-ben-habib-ben-al-toumi-al-maaroufi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdelhalim-hafed-abdelfattah-remadna', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/isam-ali-mohamed-alouche', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/said-bahaji', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ramzi-mohamed-abdullah-binalshibh', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mounir-el-motassadeq', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/zakarya-essabar', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohamad-iqbal-abdurrahman', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/nurjaman-riduan-isamuddin', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mehrez-ben-mahmoud-ben-sassi-al-amdouni', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/lionel-dumont', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/moussa-ben-omar-ben-ali-essaadi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/agus-dwikarna', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/salim-y-salamuddin-julkipli', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/aris-munandar', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdul-hakim-murad', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/parlindungan-siregar', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/yassin-syawal', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/yazid-sufaat', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/yunos-umpara-moklis', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/djamel-moustfa', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/dawood-ibrahim-kaskar', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mokhtar-belmokhtar', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/imed-ben-mekki-zarkaoui', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/kamal-ben-maoeldi-ben-hassan-al-hamraoui', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/maxamed-cabdullaah-ciise', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/radi-abd-el-samie-abou-el-yazid-el-ayashi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hamadi-ben-abdul-aziz-ben-ali-bouyehia', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohammad-tahir-hammid', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohamed-amin-mostafa', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdelmalek-droukdel', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hamid-abdallah-ahmad-al-ali', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/jaber-abdallah-jaber-ahmad-al-jalahmah', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mubarak-mushakhas-sanad-mubarak-al-bathali', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/angelo-ramirez-trinidad', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/dinno-amor-rosalejos-pareja', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/feliciano-semborio-delos-reyes-jr.', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hilarion-del-rosario-santos', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/pio-abogne-de-vera', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/redendo-cain-dellosa', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ruben-pestano-lavilla%2C-jr.', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ricardo-perez-ayeras', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/yahia-djouadi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/amor-mohamed-ghedeir', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/salah-eddine-gasmi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ahmed-deghdegh', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/adem-yilmaz', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/redouane-el-habhab', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hafiz-muhammad-saeed', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/zaki-ur-rehman-lakhvi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/haji-muhammad-ashraf', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mahmoud-mohammad-ahmed-bahaziq', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdul-haq', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/arif-qasmani', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohammed-yahya-mujahid', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/fazeel-a-tul-shaykh-abu-mohammed-ameen-al', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/akram-turki-hishan-al-mazidih', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ghazy-fezza-hishan-al-mazidih', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/muthanna-harith-al-dari', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohamed-belkalem', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/tayeb-nail', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/qasim-yahya-mahdi-al-rimi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/anwar-nasser-abdulla-al-aulaqi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/said-jan-%E2%80%98abd-al-salam', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/doku-khamatovich-umarov', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ibrahim-hassan-tali-al-asiri', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/othman-ahmed-othman-al-ghamdi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdul-rahim-ba%E2%80%99asyir', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/umar-patek', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/muhammad-jibril-abdul-rahman', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mati-ur-rehman-ali-muhammad', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abd-al-rahman-ould-muhammad-al-husayn-ould', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ibrahim-awwad-ibrahim-ali-al-badri-al-samarrai', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/monir-chouka', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/yassin-chouka', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/fazal-rahim', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mochammad-achwan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdul-rosyid-ridho-ba%E2%80%99asyir', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mustafa-hajji-muhammad-khan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hafiz-abdul-salam-bhuttavi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/zafar-iqbal', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdur-rehman', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ayyub-bashir', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/aamir-ali-chaudhry', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/djamel-akkacha', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abderrahmane-ould-el-amar', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hamada-ould-mohamed-el-khairy', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/iyad-ag-ghali', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abu-mohammed-al-jawlani', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/muhammad-jamal-abd-al-rahim-ahmad-al-kashif', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/tayeb-nail', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/qasim-yahya-mahdi-al-rimi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/anwar-nasser-abdulla-al-aulaqi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/said-jan-%E2%80%98abd-al-salam', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/doku-khamatovich-umarov', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ibrahim-hassan-tali-al-asiri', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/othman-ahmed-othman-al-ghamdi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdul-rahim-ba%E2%80%99asyir', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/umar-patek', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/muhammad-jibril-abdul-rahman', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mati-ur-rehman-ali-muhammad', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abd-al-rahman-ould-muhammad-al-husayn-ould', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ibrahim-awwad-ibrahim-ali-al-badri-al-samarrai', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/monir-chouka', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/yassin-chouka', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/fazal-rahim', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mochammad-achwan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdul-rosyid-ridho-ba%E2%80%99asyir', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mustafa-hajji-muhammad-khan', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hafiz-abdul-salam-bhuttavi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/zafar-iqbal', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdur-rehman', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ayyub-bashir', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/aamir-ali-chaudhry', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/djamel-akkacha', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abderrahmane-ould-el-amar', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hamada-ould-mohamed-el-khairy', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/iyad-ag-ghali', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abu-mohammed-al-jawlani', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/muhammad-jamal-abd-al-rahim-ahmad-al-kashif', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohamed-lahbous', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abd-al-hamid-al-masli', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abubakar-mohammed-shekau', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/said-arif', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdul-mohsen-abdallah-ibrahim-al-charekh', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abou-mohamed-al-adnani', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hamid-hamad-hamid-al-%E2%80%98ali', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdelrahman-mouhamad-zafir-al-dabidi-al-jahani', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/hajjaj-bin-fahd-al-ajmi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ahmed-abdullah-saleh-al-khazmari-al-zahrani', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/azzam-abdullah-zureik-al-maulid-al-subhi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/anders-cameroon-ostensvig-dale', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ibrahim-suleiman-hamad-al-hablain', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/seifallah-ben-omar-ben-mohamed-ben-hassine', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/%27abd-al-rahman-bin-%27umayr-al-nu%27aymi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/%E2%80%98abd-al-rahman-khalaf-%E2%80%98ubayd-juday%E2%80%99-al-%E2%80%98anizi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/anas-hasan-khattab', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/maysar-ali-musa-abdallah-al-juburi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/shafi-sultan-mohammed-al-ajmi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/%E2%80%98abd-al-rahman-muhammad-mustafa-al-qaduli', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/emilie-konig', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/kevin-jordan-axel-guiavarch', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/oumar-diaby', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ashraf-muhammad-yusuf-%27uthman-%27abd-al-salam', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ibrahim-%E2%80%98isa-hajji-muhammad-al-bakr', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/tarkhan-tayumurazovich-batirashvili', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/angga-dimas-pershada', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/bambang-sukirno', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/wiji-joko-santoso', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/maulana-fazlullah', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/mohammed-abdel-halim-hemaida-saleh', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/salim-benghalem', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abu-ubaydah-yusuf-al-anabi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/faysal-ahmad-bin-ali-al-zahrani', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/husayn-juaythini', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/muhammad-sholeh-ibrahim', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/aslan-avgazarovich-byutukaev', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ayrat-nasimovich-vakhitov', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/rustam-magomedovich-aselderov', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/bassam-ahmad-al-hasri', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/iyad-nazmi-salih-khalil', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/ghalib-abdullah-al-zaidi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/fared-saal', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/muhammad-bahrum-naim-anggih-tamtomo', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/malik-ruslanovich-barkhanoev', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/murad-iraklievich-margoshvili', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/oman-rochman', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/alexanda-amon-kotey', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/elshafee-el-sheikh', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/shane-dominic-crawford', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/salim-mustafa-muhammad-al-mansur', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/umar-mahmud-irhayyim-al-kubaysi', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/myrna-ajijul-mabanza', 'https://www.un.org/securitycouncil/sanctions/1267/aq_sanctions_list/summaries/individual/abdulpatta-escalon-abubakar', 'https://www.un.org/securitycouncil/content/adnan-abou-walid-al-sahraoui', 'https://www.un.org/securitycouncil/content/mohammed-yusip-karim', 'https://www.un.org/securitycouncil/content/mohamad-rafi-bin-udin', 'https://www.un.org/securitycouncil/content/muhammed-reza-lahaman-kiram', 'https://www.un.org/securitycouncil/content/anjem-choudary', 'https://www.un.org/securitycouncil/content/taha-ibrahim-abdallah-bakr-al-khuwayt', 'https://www.un.org/securitycouncil/content/hamza-usama-muhammad-bin-laden', 'https://www.un.org/securitycouncil/content/mohammed-masood-azhar-alvi', 'https://www.un.org/securitycouncil/content/ali-maychou', 'https://www.un.org/securitycouncil/content/bah-ag-moussa', 'https://www.un.org/securitycouncil/content/amadou-koufa', 'https://www.un.org/securitycouncil/content/amir-muhammad-sa%E2%80%99id-abdal-rahman-al-salbi', 'https://www.un.org/securitycouncil/content/noor-wali-mehsud', 'https://www.un.org/securitycouncil/content/jamal-hussein-hassan-zeiniye', 'https://www.un.org/securitycouncil/content/mohammad-ali-al-habbo', 'https://www.un.org/securitycouncil/content/emraan-ali', 'https://www.un.org/securitycouncil/content/sanaullah-ghafari', 'https://www.un.org/securitycouncil/content/ashraf-al-qizani', 'https://www.un.org/securitycouncil/content/abdul-rehman-makki%E2%80%AF', 'https://www.un.org/securitycouncil/content/maulawi-rajab', 'https://www.un.org/securitycouncil/content/sultan-aziz-azam', 'https://www.un.org/securitycouncil/content/hamza-usama-muhammad-bin-laden', 'https://www.un.org/securitycouncil/content/mohammed-masood-azhar-alvi', 'https://www.un.org/securitycouncil/content/ali-maychou', 'https://www.un.org/securitycouncil/content/bah-ag-moussa', 'https://www.un.org/securitycouncil/content/amadou-koufa', 'https://www.un.org/securitycouncil/content/amir-muhammad-sa%E2%80%99id-abdal-rahman-al-salbi', 'https://www.un.org/securitycouncil/content/noor-wali-mehsud', 'https://www.un.org/securitycouncil/content/jamal-hussein-hassan-zeiniye', 'https://www.un.org/securitycouncil/content/mohammad-ali-al-habbo', 'https://www.un.org/securitycouncil/content/emraan-ali', 'https://www.un.org/securitycouncil/content/sanaullah-ghafari', 'https://www.un.org/securitycouncil/content/ashraf-al-qizani', 'https://www.un.org/securitycouncil/content/abdul-rehman-makki%E2%80%AF', 'https://www.un.org/securitycouncil/content/maulawi-rajab', 'https://www.un.org/securitycouncil/content/sultan-aziz-azam']

# for url in summary_urls:
#     print(url)


# url_list = []
# for i in link_sdf.collect():
#     # display
#     # print(i["link"])  # , i["NAME"], i["Company"])
#     url_list.append(i["link"])

print(summary_urls[0])

response = requests(summary_urls[0])

# http = httplib2.Http()
# status, response = http.request(summary_urls[0])

print(response)
#
# for link in BeautifulSoup(response, parse_only=SoupStrainer('a')):
#     if link.has_attr('href'):
#         print(link['href'])
