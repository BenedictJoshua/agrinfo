import { useEffect, useRef, useState, type FormEvent } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

type Location = {
  id: string
  name: string
  type: 'state'
  parentId: string | null
  latitude: number
  longitude: number
  soil: string
  crops: string
  rainfall: string
  weather: string
}

type StateTopics = {
  soil: { what: string; benefits: string; formed: string }
  crops: { what: string; benefits: string }
  weather: { what: string; benefits: string }
  water: { what: string; benefits: string }
  seasons: string
  practice: string
}

type User = {
  id: number
  username: string
  firstName: string
  lastName: string
  email: string
  role: string
}

type Language = 'en' | 'ta' | 'hi'
const translations: Record<string, [string, string, string]> = {
  mapExplorer: ['Map explorer', 'வரைபட தேடல்', 'मानचित्र खोज'],
  howItWorks: ['How it works', 'இது எப்படி செயல்படுகிறது', 'यह कैसे काम करता है'],
  addMoreInfo: ['Add more info?', 'மேலும் தகவல்?', 'अधिक जानकारी जोड़ें?'],
  signupLogin: ['Signup/Login', 'பதிவு/உள்நுழைவு', 'साइनअप/लॉगिन'],
  profile: ['Profile', 'சுயவிவரம்', 'प्रोफ़ाइल'],
  logout: ['Logout', 'வெளியேறு', 'लॉगआउट'],
  builtFor: ['Built for Indian agriculture', 'இந்திய விவசாயத்திற்காக உருவாக்கப்பட்டது', 'भारतीय कृषि के लिए बनाया गया'],
  exploreArea: ['Explore your area', 'உங்கள் பகுதியைத் தேடுங்கள்', 'अपना क्षेत्र खोजें'],
  startWhere: ['Start with where you are', 'நீங்கள் இருக்கும் இடத்திலிருந்து தொடங்குங்கள்', 'जहाँ आप हैं वहीं से शुरू करें'],
  exploreByState: ['Explore India by state.', 'மாநில வாரியாக இந்தியாவைத் தேடுங்கள்.', 'राज्य के अनुसार भारत खोजें।'],
  mapHeading: ['Explore India, area by area.', 'இந்தியாவை பகுதிவாரியாகத் தேடுங்கள்.', 'भारत को क्षेत्र दर क्षेत्र खोजें।'],
  mapText: ['Search for a state to see the agricultural information currently available for that place.', 'ஒரு இடத்திற்கான விவசாயத் தகவல்களைப் பார்க்க மாநிலத்தைத் தேடுங்கள்.', 'किसी स्थान की उपलब्ध कृषि जानकारी देखने के लिए राज्य खोजें।'],
  searchState: ['Search a state', 'மாநிலத்தைத் தேடுங்கள்', 'राज्य खोजें'],
  searchPlaceholder: ['Search an Indian state...', 'இந்திய மாநிலத்தைத் தேடுங்கள்...', 'भारतीय राज्य खोजें...'],
  openHub: ['Open information hub', 'தகவல் மையத்தைத் திறக்கவும்', 'जानकारी केंद्र खोलें'],
  noState: ['No matching state found yet.', 'பொருந்தும் மாநிலம் இன்னும் கிடைக்கவில்லை.', 'कोई मिलान वाला राज्य नहीं मिला।'],
  selectedArea: ['Selected area', 'தேர்ந்தெடுக்கப்பட்ட பகுதி', 'चयनित क्षेत्र'],
  regionalSummary: ['State · Regional summary', 'மாநிலம் · பிராந்திய சுருக்கம்', 'राज्य · क्षेत्रीय सारांश'],
  soilTypes: ['Soil types', 'மண் வகைகள்', 'मिट्टी के प्रकार'],
  commonCrops: ['Common crops', 'பொதுவான பயிர்கள்', 'सामान्य फसलें'],
  rainfall: ['Rainfall', 'மழைப்பொழிவு', 'वर्षा'],
  weatherPattern: ['Weather pattern', 'வானிலை முறை', 'मौसम का स्वरूप'],
}
const t = (language: Language, key: string) => translations[key]?.[language === 'ta' ? 1 : language === 'hi' ? 2 : 0] ?? key
const localized = (language: Language, english: string, tamil: string, hindi: string) => language === 'ta' ? tamil : language === 'hi' ? hindi : english

const stateProfiles: Array<[string, number, number]> = [
  ['Andhra Pradesh', 15.9129, 79.7400], ['Arunachal Pradesh', 28.2180, 94.7278],
  ['Assam', 26.2006, 92.9376], ['Bihar', 25.0961, 85.3131], ['Chhattisgarh', 21.2787, 81.8661],
  ['Goa', 15.2993, 74.1240], ['Gujarat', 22.2587, 71.1924], ['Haryana', 29.0588, 76.0856],
  ['Himachal Pradesh', 31.1048, 77.1734], ['Jharkhand', 23.6102, 85.2799], ['Karnataka', 15.3173, 75.7139],
  ['Kerala', 10.8505, 76.2711], ['Madhya Pradesh', 22.9734, 78.6569], ['Maharashtra', 19.7515, 75.7139],
  ['Manipur', 24.6637, 93.9063], ['Meghalaya', 25.4670, 91.3662], ['Mizoram', 23.1645, 92.9376],
  ['Nagaland', 26.1584, 94.5624], ['Odisha', 20.9517, 85.0985], ['Punjab', 31.1471, 75.3412],
  ['Rajasthan', 27.0238, 74.2179], ['Sikkim', 27.5330, 88.5122], ['Tamil Nadu', 11.1271, 78.6569],
  ['Telangana', 18.1124, 79.0193], ['Tripura', 23.9408, 91.9882], ['Uttar Pradesh', 26.8467, 80.9462],
  ['Uttarakhand', 30.0668, 79.0193], ['West Bengal', 22.9868, 87.8550],
  ['Andaman and Nicobar Islands', 11.7401, 92.6586], ['Chandigarh', 30.7333, 76.7794],
  ['Dadra and Nagar Haveli and Daman and Diu', 20.1809, 73.0169], ['Delhi', 28.7041, 77.1025],
  ['Jammu and Kashmir', 33.7782, 76.5762], ['Ladakh', 34.1526, 77.5771],
  ['Lakshadweep', 10.5667, 72.6417], ['Puducherry', 11.9416, 79.8083],
]

const profileDetails: Record<string, Pick<Location, 'soil' | 'crops' | 'rainfall' | 'weather'>> = {
  'Tamil Nadu': { soil: 'Red loamy and black cotton soils', crops: 'Rice, sugarcane, cotton, groundnut', rainfall: 'Regional summary; varies by district', weather: 'Tropical climate with southwest and northeast monsoons' },
  Karnataka: { soil: 'Red, black, and laterite soils', crops: 'Ragi, coffee, cotton, sugarcane', rainfall: 'Regional summary; varies by district', weather: 'Tropical climate with distinct wet and dry seasons' },
  Maharashtra: { soil: 'Deep black cotton and laterite soils', crops: 'Cotton, soybean, sugarcane, pulses', rainfall: 'Regional summary; varies by district', weather: 'Tropical monsoon climate with regional variation' },
  'Uttar Pradesh': { soil: 'Alluvial soils across the plains', crops: 'Wheat, rice, sugarcane, pulses', rainfall: 'Regional summary; varies by district', weather: 'Subtropical climate with hot summers and monsoon rainfall' },
  Kerala: { soil: 'Laterite, coastal alluvial, and forest soils', crops: 'Coconut, rubber, rice, spices', rainfall: 'Regional summary; varies by district', weather: 'Humid tropical climate with strong monsoon rainfall' },
  Rajasthan: { soil: 'Desert, alluvial, and black soils', crops: 'Pearl millet, wheat, mustard, pulses', rainfall: 'Regional summary; varies by district', weather: 'Arid to semi-arid climate with large seasonal variation' },
  Punjab: { soil: 'Fertile alluvial soils', crops: 'Wheat, rice, maize, cotton', rainfall: 'Regional summary; varies by district', weather: 'Semi-arid to subtropical climate with hot summers' },
}

const stateTopics: Record<string, StateTopics> = {
  'Andhra Pradesh': { soil: { what: 'Red soils, black cotton soils, and coastal alluvial soils.', benefits: 'Support groundnut, pulses, cotton, rice, and horticulture when nutrients and moisture are managed.', formed: 'Weathering of rocks, river deposits, and coastal sediments over long periods.' }, crops: { what: 'Rice, groundnut, chilli, cotton, tobacco, and mango are important crops.', benefits: 'Provide food, oilseeds, fibre, spices, and horticultural income across different regions.' }, weather: { what: 'Tropical climate with hot summers and monsoon rainfall.', benefits: 'Warm conditions support long growing seasons, while rainfall timing guides sowing and irrigation.' }, water: { what: 'Canals, tanks, rivers, groundwater, and rainfed farming are used.', benefits: 'Water storage and efficient irrigation reduce risk during uneven monsoon periods.' }, seasons: 'Kharif crops are generally sown with the southwest monsoon; rabi crops follow in cooler months.', practice: 'Use local crop calendars and soil tests before choosing varieties or fertilizer.' },
  'Arunachal Pradesh': { soil: { what: 'Mountain forest soils, brown hill soils, and alluvial valley soils.', benefits: 'Support rice, maize, millets, fruits, vegetables, and plantation crops in suitable elevations.', formed: 'Developed from weathered mountain rocks, forest litter, and material moved downslope by rivers.' }, crops: { what: 'Rice, maize, millet, oranges, kiwi, ginger, and large cardamom.', benefits: 'Combine staple food production with high-value horticulture suited to hill environments.' }, weather: { what: 'Humid subtropical to alpine conditions with heavy monsoon rain.', benefits: 'Cooler elevations enable temperate fruits while warmer valleys support tropical crops.' }, water: { what: 'Rainfall, springs, streams, and small irrigation systems.', benefits: 'Spring protection and soil-water conservation help maintain production on slopes.' }, seasons: 'Crop timing changes strongly with elevation; monsoon crops dominate lower valleys.', practice: 'Contour farming and erosion control are important on sloping land.' },
  Assam: { soil: { what: 'Alluvial soils in river plains and red or lateritic soils in uplands.', benefits: 'Alluvial areas are productive for rice, vegetables, mustard, and jute.', formed: 'Built mainly from repeated deposits of Brahmaputra and Barak river sediments, with weathering in uplands.' }, crops: { what: 'Rice, tea, jute, mustard, sugarcane, and vegetables.', benefits: 'Support staple grains, plantation income, fibre, oilseeds, and local markets.' }, weather: { what: 'Humid monsoon climate with high rainfall and flood variability.', benefits: 'Abundant moisture supports multiple crops but requires flood-resilient planning.' }, water: { what: 'Rivers, wetlands, ponds, rainfall, and shallow groundwater.', benefits: 'Raised beds, drainage, and flood-adapted varieties protect crops.' }, seasons: 'Rice types and sowing windows vary between early, winter, and flood-prone seasons.', practice: 'Choose varieties according to flood duration and local soil drainage.' },
  Bihar: { soil: { what: 'Deep fertile alluvial soils with newer and older river deposits.', benefits: 'Good moisture and nutrient-holding capacity support cereals, pulses, oilseeds, and vegetables.', formed: 'Deposited and renewed by the Ganga and its tributaries, with differences in sand, silt, and clay.' }, crops: { what: 'Rice, wheat, maize, pulses, sugarcane, litchi, and vegetables.', benefits: 'Provide staple food, livestock feed, fruit income, and diversified farm earnings.' }, weather: { what: 'Humid subtropical climate with hot summers, monsoon rain, and cool winters.', benefits: 'Distinct seasons allow rice-wheat rotations and winter vegetables.' }, water: { what: 'Canals, tubewells, rivers, ponds, and rainfall.', benefits: 'Supplemental irrigation helps protect rabi crops when winter rain is limited.' }, seasons: 'Kharif rice and maize are followed by rabi wheat, pulses, and oilseeds.', practice: 'Drainage and timely sowing are important in flood- and waterlogging-prone areas.' },
  'Chhattisgarh': { soil: { what: 'Red and yellow soils, lateritic soils, and medium to deep black soils.', benefits: 'Rice dominates suitable lowlands; uplands support pulses, millets, and oilseeds.', formed: 'Created by weathering of ancient rocks and movement of clay and iron under seasonal rainfall.' }, crops: { what: 'Rice, maize, soybean, pulses, millets, and oilseeds.', benefits: 'Support food security and climate-resilient dryland farming.' }, weather: { what: 'Tropical wet-and-dry climate with concentrated monsoon rainfall.', benefits: 'A clear rainy season supports kharif farming when water is conserved.' }, water: { what: 'Rainfed fields, tanks, check dams, rivers, and groundwater.', benefits: 'Small water-harvesting structures extend moisture into dry periods.' }, seasons: 'Kharif rice is central; rabi pulses and oilseeds use stored soil moisture.', practice: 'Millets and pulses can reduce risk in upland and drought-prone fields.' },
  Goa: { soil: { what: 'Laterite soils, coastal alluvial soils, and sandy soils.', benefits: 'Support rice in lowlands, coconut and cashew on uplands, and horticulture.', formed: 'Strong tropical weathering leached older rocks and concentrated iron and aluminium in laterite.' }, crops: { what: 'Rice, coconut, cashew, arecanut, vegetables, and fruits.', benefits: 'Provide food, tree-crop income, and diversified small-farm production.' }, weather: { what: 'Warm humid coastal climate with strong southwest monsoon.', benefits: 'High humidity supports tree crops but increases disease and drainage needs.' }, water: { what: 'Monsoon storage, streams, wells, ponds, and small irrigation.', benefits: 'Water storage helps bridge the dry season after monsoon crops.' }, seasons: 'Rice is mainly monsoon-season; cashew and coconut are managed year-round.', practice: 'Maintain drainage and organic matter in lateritic soils.' },
  'Gujarat': { soil: { what: 'Black cotton, alluvial, sandy, saline, and coastal soils.', benefits: 'Different soil zones support cotton, groundnut, wheat, cumin, vegetables, and fodder.', formed: 'Basalt weathering forms black soils; rivers and coastal processes form alluvial and saline soils.' }, crops: { what: 'Cotton, groundnut, wheat, bajra, cumin, castor, and dates.', benefits: 'Support fibre, oilseed, cereal, spice, and horticultural value chains.' }, weather: { what: 'Mostly semi-arid to dry tropical, with monsoon concentration and coastal variation.', benefits: 'Dry weather supports harvest and storage, while irrigation enables rabi crops.' }, water: { what: 'Canals, wells, check dams, reservoirs, and drip irrigation.', benefits: 'Efficient irrigation is valuable where rainfall is limited or irregular.' }, seasons: 'Kharif groundnut, cotton, and bajra are followed by rabi wheat and cumin in irrigated zones.', practice: 'Manage salinity and protect groundwater through efficient irrigation.' },
  'Haryana': { soil: { what: 'Alluvial soils with sandy and loamy zones.', benefits: 'Fertile irrigated soils support intensive wheat, rice, cotton, and horticulture.', formed: 'Deposited by the Yamuna and Ghaggar systems and shaped by wind and irrigation in western areas.' }, crops: { what: 'Wheat, rice, mustard, cotton, pearl millet, and vegetables.', benefits: 'Support major cereal production, oilseeds, fibre, and nearby markets.' }, weather: { what: 'Semi-arid to subtropical climate with hot summers and cool winters.', benefits: 'Cool winters favour wheat and mustard; irrigation reduces rainfall dependence.' }, water: { what: 'Canals, tubewells, reservoirs, and rainfall.', benefits: 'Irrigation stabilizes production but requires groundwater conservation.' }, seasons: 'Rice and cotton are mainly kharif; wheat and mustard are major rabi crops.', practice: 'Crop diversification and water-saving irrigation are important.' },
  'Himachal Pradesh': { soil: { what: 'Mountain forest, brown hill, and valley alluvial soils.', benefits: 'Support apples, stone fruits, maize, wheat, vegetables, and tea in suitable elevations.', formed: 'Developed from weathered mountain rocks, forest organic matter, and river deposits in valleys.' }, crops: { what: 'Apple, stone fruits, maize, wheat, vegetables, and tea.', benefits: 'High-value horticulture provides income where terrain limits field crops.' }, weather: { what: 'Climate ranges from subtropical valleys to cold alpine zones.', benefits: 'Elevation creates niches for both temperate fruits and warm-season crops.' }, water: { what: 'Snowmelt, springs, streams, canals, and rainwater.', benefits: 'Spring recharge and efficient hillside irrigation support orchards.' }, seasons: 'Sowing and harvest dates vary greatly by altitude; winter chill is important for many fruits.', practice: 'Terracing, mulching, and slope stabilization protect soil.' },
  'Jharkhand': { soil: { what: 'Red and yellow soils, lateritic soils, and valley alluvial soils.', benefits: 'Support rice in lowlands and millets, pulses, oilseeds, and vegetables in uplands.', formed: 'Formed through weathering of granite and other ancient rocks under seasonal rainfall.' }, crops: { what: 'Rice, maize, pulses, oilseeds, millets, vegetables, and lac host trees.', benefits: 'Support food crops and resilient livelihood options in rainfed areas.' }, weather: { what: 'Tropical wet-and-dry climate with monsoon rainfall.', benefits: 'Rain supports kharif crops while water harvesting helps the dry season.' }, water: { what: 'Rainfall, ponds, check dams, streams, and groundwater.', benefits: 'Small reservoirs and farm ponds improve supplemental irrigation.' }, seasons: 'Kharif rice and maize are followed by rabi pulses, oilseeds, and vegetables.', practice: 'Add organic matter and reduce erosion on upland fields.' },
  'Karnataka': { soil: { what: 'Red loamy, black cotton, laterite, and coastal soils.', benefits: 'Support ragi, coffee, cotton, sugarcane, pulses, and horticulture.', formed: 'Developed from weathered granite, basalt, laterite, and coastal materials.' }, crops: { what: 'Ragi, coffee, cotton, sugarcane, maize, pulses, and spices.', benefits: 'Provide staple foods, plantation income, fibre, sugar, and diverse market products.' }, weather: { what: 'Tropical climate with wet and dry seasons and strong elevation differences.', benefits: 'Elevation supports coffee and horticulture while plains support cereals and pulses.' }, water: { what: 'Reservoirs, canals, tanks, borewells, and rainfall.', benefits: 'Tank restoration and drip irrigation help manage variable rainfall.' }, seasons: 'Kharif sowing follows the southwest monsoon; rabi crops use residual moisture or irrigation.', practice: 'Choose crops by rainfall zone and test black soils for drainage needs.' },
  'Kerala': { soil: { what: 'Laterite, coastal alluvial, riverine, and forest soils.', benefits: 'Support coconut, rubber, rice, spices, banana, and mixed home-garden systems.', formed: 'Intense tropical weathering forms laterite; rivers and coastal waters deposit alluvial sediments.' }, crops: { what: 'Coconut, rubber, rice, pepper, cardamom, banana, and vegetables.', benefits: 'Enable high-value plantation, spice, food, and multi-storey farming systems.' }, weather: { what: 'Humid tropical climate with two monsoon influences and short dry periods.', benefits: 'High moisture supports perennial crops, with drainage needed during heavy rain.' }, water: { what: 'Monsoon rainfall, rivers, wells, ponds, and small irrigation.', benefits: 'Rainwater storage and drainage protect crops through alternating wet and dry periods.' }, seasons: 'Rice seasons vary by local water conditions; perennial crops are managed throughout the year.', practice: 'Mulching, drainage, and soil organic matter are central to sustainable production.' },
  'Madhya Pradesh': { soil: { what: 'Black cotton soils, red-yellow soils, and alluvial soils.', benefits: 'Support soybean, wheat, gram, pulses, cotton, and horticulture.', formed: 'Basalt weathering creates black soils; older rocks and river deposits form red and alluvial zones.' }, crops: { what: 'Soybean, wheat, gram, pulses, maize, cotton, and garlic.', benefits: 'Provide oilseeds, cereals, pulses, fibre, and high-value spice income.' }, weather: { what: 'Tropical climate with hot summers, monsoon rain, and mild winters.', benefits: 'Seasonal contrast supports kharif soybean and rabi wheat or gram rotations.' }, water: { what: 'Reservoirs, rivers, wells, farm ponds, and rainfall.', benefits: 'Water harvesting supports rabi crops and reduces dry-spell losses.' }, seasons: 'Soybean and maize dominate kharif; wheat and gram are important rabi crops.', practice: 'Retain crop residue and manage black-soil cracking and drainage.' },
  'Maharashtra': { soil: { what: 'Deep black cotton, red, laterite, and coastal alluvial soils.', benefits: 'Support cotton, soybean, sugarcane, pulses, grapes, and horticulture.', formed: 'Black soil comes mainly from basalt weathering; rivers and coastal processes form other zones.' }, crops: { what: 'Cotton, soybean, sugarcane, sorghum, grapes, oranges, and pulses.', benefits: 'Combine dryland staples with fibre, sugar, fruit, and processing industries.' }, weather: { what: 'Tropical monsoon climate with dry interiors and wetter western areas.', benefits: 'Regional rainfall diversity allows varied crops but requires local planning.' }, water: { what: 'Dams, canals, wells, farm ponds, and drip systems.', benefits: 'Micro-irrigation is especially useful for orchards and water-limited zones.' }, seasons: 'Kharif cotton, soybean, and sorghum are followed by rabi sorghum, wheat, and gram.', practice: 'Use watershed management and avoid over-irrigating heavy black soils.' },
  'Manipur': { soil: { what: 'Valley alluvial soils and red or brown hill soils.', benefits: 'Support rice in valleys and horticulture, maize, pulses, and vegetables in hills.', formed: 'Valley soils come from river deposits; hill soils develop from weathered rocks and forest matter.' }, crops: { what: 'Rice, maize, pulses, vegetables, pineapple, and spices.', benefits: 'Support staple food, hill horticulture, and local market diversification.' }, weather: { what: 'Humid subtropical monsoon climate with cooler hill conditions.', benefits: 'Moderate temperatures support vegetables and fruit in elevated areas.' }, water: { what: 'Rainfall, rivers, wetlands, ponds, and springs.', benefits: 'Valley water management supports rice while hillside storage helps horticulture.' }, seasons: 'Rice follows monsoon timing; vegetables and horticultural crops vary by elevation.', practice: 'Prevent erosion and protect wetlands that regulate water.' },
  'Meghalaya': { soil: { what: 'Red loamy, lateritic, and shallow hill soils.', benefits: 'Support rice, maize, potato, ginger, turmeric, fruits, and plantation crops.', formed: 'Strong rainfall weathering and leaching create acidic soils with organic matter on forested slopes.' }, crops: { what: 'Rice, potato, maize, ginger, turmeric, pineapple, and oranges.', benefits: 'Provide staple food and high-value horticultural and spice income.' }, weather: { what: 'Very wet monsoon climate with cool, moist uplands.', benefits: 'High rainfall supports horticulture but increases erosion and nutrient leaching.' }, water: { what: 'Rainfall, springs, streams, ponds, and small storage systems.', benefits: 'Spring protection and terracing improve water availability and reduce runoff.' }, seasons: 'Monsoon crops dominate; cool-season vegetables are grown where elevation permits.', practice: 'Use soil conservation, liming where recommended, and organic amendments.' },
  'Mizoram': { soil: { what: 'Red loamy and lateritic hill soils, often acidic and shallow.', benefits: 'Support rice, maize, vegetables, fruits, and bamboo-based systems with careful management.', formed: 'Developed from weathered sedimentary rocks under high rainfall and steep slopes.' }, crops: { what: 'Rice, maize, ginger, turmeric, banana, citrus, and vegetables.', benefits: 'Support food production and high-value hill horticulture.' }, weather: { what: 'Humid monsoon climate with heavy rain and mild upland temperatures.', benefits: 'Long growing conditions favour horticulture when erosion is controlled.' }, water: { what: 'Rainfall, springs, streams, and rainwater storage.', benefits: 'Small storage systems provide water between rain events and seasons.' }, seasons: 'Monsoon sowing is common; crop timing follows slope, elevation, and rainfall.', practice: 'Contour planting and permanent ground cover protect fragile slopes.' },
  'Nagaland': { soil: { what: 'Red and brown hill soils with alluvial pockets in valleys.', benefits: 'Support rice, maize, millets, vegetables, fruits, and spices.', formed: 'Formed from weathered hill rocks, forest litter, and valley river deposits.' }, crops: { what: 'Rice, maize, millets, vegetables, pineapple, and ginger.', benefits: 'Combine staple crops with diversified hill horticulture.' }, weather: { what: 'Humid subtropical monsoon climate with cooler uplands.', benefits: 'Moist conditions support multiple crops but make erosion control essential.' }, water: { what: 'Rainfall, springs, streams, and small ponds.', benefits: 'Water harvesting helps stabilize vegetable and dry-season production.' }, seasons: 'Rice and maize generally follow monsoon rainfall; vegetables can be staggered by elevation.', practice: 'Agroforestry and contour measures help conserve soil.' },
  'Odisha': { soil: { what: 'Alluvial coastal soils, red and yellow soils, laterite, and black soils.', benefits: 'Support rice, pulses, oilseeds, vegetables, and cashew across varied regions.', formed: 'River and delta deposits form coastal soils; weathering of ancient rocks forms upland soils.' }, crops: { what: 'Rice, pulses, groundnut, mustard, vegetables, and cashew.', benefits: 'Support staple food, protein crops, oilseeds, and coastal horticulture.' }, weather: { what: 'Tropical monsoon climate with cyclone and flood risk along the coast.', benefits: 'Monsoon moisture supports rice, while resilient varieties reduce weather risk.' }, water: { what: 'Rivers, canals, tanks, ponds, groundwater, and rainfall.', benefits: 'Drainage, water storage, and flood planning protect production.' }, seasons: 'Kharif rice is central; rabi pulses and oilseeds use residual moisture or irrigation.', practice: 'Use flood- and cyclone-aware crop calendars in coastal districts.' },
  'Punjab': { soil: { what: 'Deep fertile alluvial soils with sandy and loamy zones.', benefits: 'Support wheat, rice, maize, cotton, and vegetables under irrigation.', formed: 'Deposited by Himalayan rivers and modified by long-term cultivation and irrigation.' }, crops: { what: 'Wheat, rice, maize, cotton, mustard, and vegetables.', benefits: 'Provide major cereal supplies, fibre, oilseeds, and market-oriented production.' }, weather: { what: 'Semi-arid to subtropical climate with hot summers and cool winters.', benefits: 'Cool winters favour wheat; irrigation supports kharif rice where suitable.' }, water: { what: 'Canals, tubewells, rivers, and rainfall.', benefits: 'Reliable water supports high yields but demands groundwater conservation.' }, seasons: 'Rice or maize in kharif is followed by wheat and mustard in rabi.', practice: 'Diversify crops and use water-saving methods to protect soil and groundwater.' },
  'Rajasthan': { soil: { what: 'Desert sandy soils, alluvial soils, saline soils, and black soil pockets.', benefits: 'Support pearl millet, pulses, mustard, wheat, guar, and drought-tolerant crops.', formed: 'Wind deposits, river sediments, salt accumulation, and weathering create strong regional differences.' }, crops: { what: 'Pearl millet, wheat, mustard, gram, guar, cumin, and fenugreek.', benefits: 'Provide resilient dryland food, oilseeds, pulses, spices, and livestock feed.' }, weather: { what: 'Arid to semi-arid climate with low and irregular rainfall.', benefits: 'Dry conditions reduce some disease pressure but make water conservation critical.' }, water: { what: 'Rainwater harvesting, canals, wells, tanks, and drip irrigation.', benefits: 'Storage and efficient irrigation extend production through long dry periods.' }, seasons: 'Kharif pearl millet and guar rely on monsoon; rabi mustard and wheat need stored or irrigated water.', practice: 'Use drought-tolerant varieties, mulching, and farm ponds.' },
  'Sikkim': { soil: { what: 'Mountain forest soils, brown hill soils, and valley alluvial soils.', benefits: 'Support large cardamom, ginger, vegetables, maize, and temperate fruits.', formed: 'Developed from weathered Himalayan rocks, forest organic matter, and river deposits.' }, crops: { what: 'Large cardamom, ginger, turmeric, maize, vegetables, and oranges.', benefits: 'Support specialty crops and high-value mountain horticulture.' }, weather: { what: 'Cool mountain climate with heavy monsoon and strong elevation effects.', benefits: 'Elevation supports temperate crops and long-season spices.' }, water: { what: 'Springs, streams, rainfall, and small irrigation systems.', benefits: 'Spring management is vital for farms and communities.' }, seasons: 'Crop timing changes by altitude; monsoon moisture drives most field production.', practice: 'Terracing, mulching, and organic soil management reduce erosion.' },
  'Tamil Nadu': { soil: { what: 'Red loamy, black cotton, alluvial, and coastal soils.', benefits: 'Support rice, sugarcane, cotton, groundnut, millets, and horticulture.', formed: 'Rock weathering, river deposits, and coastal processes create distinct soil zones.' }, crops: { what: 'Rice, sugarcane, cotton, groundnut, millets, banana, and vegetables.', benefits: 'Provide staple food, fibre, sugar, oilseeds, and diverse horticultural income.' }, weather: { what: 'Tropical climate influenced by both southwest and northeast monsoons.', benefits: 'Different rainfall seasons allow varied crop calendars across districts.' }, water: { what: 'Reservoirs, tanks, canals, wells, and rainwater harvesting.', benefits: 'Tank restoration and efficient irrigation help manage seasonal rainfall.' }, seasons: 'Sowing windows vary between southwest and northeast monsoon zones; irrigated crops may be year-round.', practice: 'Choose varieties by water availability and protect soil moisture with mulches.' },
  'Telangana': { soil: { what: 'Red sandy loam, black cotton, and alluvial soils.', benefits: 'Support cotton, rice, maize, soybean, pulses, and horticulture.', formed: 'Granite weathering creates red soils; basalt and river deposits create black and alluvial zones.' }, crops: { what: 'Cotton, rice, maize, soybean, red gram, chilli, and turmeric.', benefits: 'Support fibre, cereals, pulses, spices, and processing value chains.' }, weather: { what: 'Hot semi-arid to tropical climate with monsoon rainfall.', benefits: 'Warm conditions support long-season crops when water is available.' }, water: { what: 'Reservoirs, tanks, canals, borewells, and rainfall.', benefits: 'Tank restoration and micro-irrigation improve resilience during dry spells.' }, seasons: 'Kharif cotton, maize, and pulses are followed by rabi crops where moisture permits.', practice: 'Test red soils for nutrients and avoid over-irrigating heavy black soils.' },
  'Tripura': { soil: { what: 'Red loamy and lateritic hill soils with alluvial valley soils.', benefits: 'Support rice, rubber, pineapple, tea, bamboo, and vegetables.', formed: 'Hill soils arise from weathered sediments; valleys receive river-borne alluvial deposits.' }, crops: { what: 'Rice, rubber, pineapple, tea, bamboo, jackfruit, and vegetables.', benefits: 'Combine staple food with plantation and fruit-based income.' }, weather: { what: 'Humid subtropical monsoon climate with warm, wet summers.', benefits: 'Long warm seasons support perennial crops and horticulture.' }, water: { what: 'Rainfall, ponds, streams, wells, and small irrigation.', benefits: 'Storage and drainage help manage heavy rain and dry intervals.' }, seasons: 'Rice follows monsoon timing; pineapple, rubber, and other perennials are managed year-round.', practice: 'Use erosion control and organic matter on red and lateritic soils.' },
  'Uttar Pradesh': { soil: { what: 'Alluvial soils across the Ganga, Yamuna, and Ghaghara plains.', benefits: 'Support wheat, rice, sugarcane, pulses, vegetables, and fruit.', formed: 'Repeated river deposition creates layers of sand, silt, clay, and nutrient-rich floodplain material.' }, crops: { what: 'Wheat, rice, sugarcane, potato, pulses, and mango.', benefits: 'Provide staple cereals, sugar, vegetables, pulses, and horticultural value.' }, weather: { what: 'Subtropical climate with hot summers, monsoon rain, and cool winters.', benefits: 'Distinct seasons support rice-wheat rotations and winter crops.' }, water: { what: 'Canals, tubewells, rivers, ponds, and rainfall.', benefits: 'Supplemental irrigation stabilizes rabi crops and vegetables.' }, seasons: 'Kharif rice, maize, and sugarcane are followed by rabi wheat, potato, and pulses.', practice: 'Improve drainage in lowlands and use soil tests to balance nutrients.' },
  'Uttarakhand': { soil: { what: 'Mountain forest, brown hill, and valley alluvial soils.', benefits: 'Support rice, wheat, millets, pulses, fruits, and vegetables at different elevations.', formed: 'Weathered mountain rock, forest litter, slope movement, and river deposits create varied soils.' }, crops: { what: 'Rice, wheat, millets, pulses, apples, vegetables, and spices.', benefits: 'Provide staple food and high-value hill horticulture.' }, weather: { what: 'Climate ranges from subtropical foothills to cold alpine zones.', benefits: 'Elevation creates diverse crop niches and fruit-growing conditions.' }, water: { what: 'Snowmelt, springs, streams, canals, and rainwater.', benefits: 'Spring recharge and small irrigation systems support terraced farms.' }, seasons: 'Crop calendars vary by altitude; monsoon crops and winter wheat are common in suitable zones.', practice: 'Terrace maintenance and slope stabilization protect soil and water.' },
  'West Bengal': { soil: { what: 'Alluvial delta soils, red-lateritic soils, and coastal saline soils.', benefits: 'Support rice, jute, potato, tea, vegetables, and fish-linked farming.', formed: 'Ganga-Brahmaputra deposits form delta soils; older uplands and coastal tides create other types.' }, crops: { what: 'Rice, jute, potato, tea, vegetables, and mango.', benefits: 'Provide staple food, fibre, horticulture, plantation income, and processing opportunities.' }, weather: { what: 'Humid monsoon climate with flood, cyclone, and coastal salinity risks.', benefits: 'High rainfall supports rice but needs drainage and resilient planning.' }, water: { what: 'Rivers, canals, ponds, groundwater, rainfall, and tidal systems.', benefits: 'Water management supports rice, vegetables, and integrated farming.' }, seasons: 'Multiple rice seasons are possible; potato, mustard, and vegetables are important in cooler months.', practice: 'Use saline- and flood-aware practices in coastal and delta districts.' },
}

const stateLocations: Location[] = stateProfiles.map(([name, latitude, longitude]) => ({
  id: name.toLowerCase().replaceAll(' ', '-'),
  name,
  type: 'state',
  parentId: null,
  latitude,
  longitude,
  ...(profileDetails[name] ?? {
    soil: 'Regional soil profile pending verification',
    crops: 'Regional crop profile pending verification',
    rainfall: 'Regional rainfall data pending verification',
    weather: 'Regional weather profile pending verification',
  }),
}))

const locations = stateLocations

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('primary-key-user')
    return stored ? JSON.parse(stored) as User : null
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('primary-key-language')
    return stored === 'ta' || stored === 'hi' ? stored : 'en'
  })
  const [selectedLocation, setSelectedLocation] = useState('')
  const [locationResults, setLocationResults] = useState<Location[]>(locations)
  const [selectedPlace, setSelectedPlace] = useState<Location>(locations[0])
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    const mapElement = document.getElementById('map-preview')
    if (!token || !mapElement) return
    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapElement,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [78.9629, 20.5937],
      zoom: 3.8,
      attributionControl: true,
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [path])

  const openLocation = () => {
    const query = selectedLocation.trim().toLowerCase()
    const matches = query
      ? locations.filter((location) => location.name.toLowerCase().includes(query))
      : locations
    setLocationResults(matches)
    if (matches[0]) {
      setSelectedPlace(matches[0])
      mapRef.current?.flyTo({ center: [matches[0].longitude, matches[0].latitude], zoom: matches[0].type === 'state' ? 6 : 9, essential: true })
      window.history.pushState({}, '', `/state/${matches[0].id}`)
      setPath(`/state/${matches[0].id}`)
    }
  }

  if (path.startsWith('/state/')) {
    const stateId = path.replace('/state/', '')
    const state = locations.find((location) => location.id === stateId) ?? selectedPlace
    return <StateHub location={state} onBack={() => window.history.back()} language={language} />
  }
  if (path === '/signup') return <SignupPage language={language} onBack={() => window.history.back()} onLogin={() => setPath('/login')} onSuccess={(nextUser) => { setUser(nextUser); localStorage.setItem('primary-key-user', JSON.stringify(nextUser)); setPath('/') }} />
  if (path === '/login') return <LoginPage language={language} onBack={() => window.history.back()} onSuccess={(nextUser) => { setUser(nextUser); localStorage.setItem('primary-key-user', JSON.stringify(nextUser)); setPath('/') }} />
  if (path === '/forgot-password') return <ForgotPasswordPage language={language} onBack={() => window.history.back()} onSuccess={() => setPath('/')} />
  if (path === '/profile' && user) return <ProfilePage language={language} user={user} onBack={() => setPath('/')} onSaved={(nextUser) => { setUser(nextUser); localStorage.setItem('primary-key-user', JSON.stringify(nextUser)) }} />
  if (path === '/add-info') return <AddInfoPage language={language} onBack={() => setPath('/')} />

  return (
    <main>
      <nav className="nav container" aria-label="Primary navigation">
        <a className="brand" href="/" aria-label="Agrinfo home">
          <span className="brand-mark" aria-hidden="true">⌁</span>
          <span>Agr<strong>info</strong></span>
        </a>
        <div className="nav-links">
          <a href="#map-explorer">{t(language, 'mapExplorer')}</a>
          <a href="#trust">{t(language, 'howItWorks')}</a>
          <button className="nav-link-button" type="button" onClick={() => { window.history.pushState({}, '', '/add-info'); setPath('/add-info') }}>{t(language, 'addMoreInfo')}</button>
        </div>
        <div className="nav-actions">
          <label className="language-picker">
            <span className="visually-hidden">Language</span>
            <select value={language} onChange={(event) => { const next = event.target.value as Language; setLanguage(next); localStorage.setItem('primary-key-language', next) }}>
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
          {user ? (
            <div className="profile-menu">
              <button className="profile-button" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
                <span className="profile-circle">{user.firstName.charAt(0).toUpperCase()}</span>
                <span>{user.firstName}</span>
              </button>
              {profileOpen && <div className="profile-dropdown">
                <button type="button" onClick={() => { setProfileOpen(false); setPath('/profile') }}>{t(language, 'profile')}</button>
                <button type="button" onClick={() => { localStorage.removeItem('primary-key-user'); setUser(null); setProfileOpen(false); setPath('/') }}>{t(language, 'logout')}</button>
              </div>}
            </div>
          ) : <a className="button button-primary" href="/signup">{t(language, 'signupLogin')}</a>}
        </div>
      </nav>

      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> {t(language, 'builtFor')}</p>
          <h1>Better farming starts with <em>better information.</em></h1>
          <p className="hero-text">
            Agrinfo connects farmers to reliable, local agricultural information about crops,
            seeds, soil, weather, and the land they care for.
          </p>
          <div className="hero-actions">
            <a className="button button-primary button-large" href="#explore">{t(language, 'exploreArea')} <span aria-hidden="true">→</span></a>
          </div>
          <div className="trust-note"><span aria-hidden="true">✓</span> Clear sources. Honest data. Made for farmers.</div>
        </div>
        <div className="hero-art" aria-label="Illustration of a green agricultural field" role="img">
          <div className="sun" />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          <div className="field-lines" />
          <div className="plant plant-one">♧</div>
          <div className="plant plant-two">♧</div>
          <div className="plant plant-three">♧</div>
          <div className="art-label"><span className="live-dot" /> Growing knowledge, together</div>
        </div>
      </section>

      <section className="explorer-section" id="explore">
        <div className="container explorer">
          <div>
            <p className="eyebrow">{t(language, 'startWhere')}</p>
            <h2>{t(language, 'exploreByState')}</h2>
            <p className="section-text">{t(language, 'mapText')}</p>
          </div>
        </div>
      </section>

      <section className="map-explorer-section" id="map-explorer">
        <div className="container map-explorer-heading">
          <div>
            <p className="eyebrow">{t(language, 'mapExplorer')}</p>
            <h2>{t(language, 'mapHeading')}</h2>
            <p className="section-text">{t(language, 'mapText')}</p>
          </div>
          <div className="search-results" aria-live="polite">
            <label htmlFor="map-location-search">{t(language, 'searchState')}</label>
            <input
              id="map-location-search"
              list="location-options"
              value={selectedLocation}
              onChange={(event) => {
                setSelectedLocation(event.target.value)
                const query = event.target.value.toLowerCase()
                setLocationResults(locations.filter((location) => location.name.toLowerCase().includes(query)))
              }}
              placeholder={t(language, 'searchPlaceholder')}
            />
            <datalist id="location-options">
              {locations.map((location) => <option key={location.id} value={location.name} />)}
            </datalist>
            <button className="button button-primary" type="button" onClick={openLocation}>{t(language, 'openHub')}</button>
            {locationResults.length === 0 && <p className="no-results">{t(language, 'noState')}</p>}
          </div>
        </div>
        <div className="container">
          <div className="map-preview" id="map-preview" aria-label="Interactive map of India">
          {!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN && (
            <p>Map preview will appear after a restricted Mapbox token is configured.</p>
          )}
          </div>
          <div className="location-summary">
            <div className="summary-title">
              <p className="eyebrow">{t(language, 'selectedArea')}</p>
              <h3>{selectedPlace.name} information hub</h3>
              <span>{t(language, 'regionalSummary')}</span>
            </div>
            <div className="summary-cards">
              <article><span aria-hidden="true">▰</span><strong>{t(language, 'soilTypes')}</strong><p>{selectedPlace.soil}</p></article>
              <article><span aria-hidden="true">◒</span><strong>{t(language, 'commonCrops')}</strong><p>{selectedPlace.crops}</p></article>
              <article><span aria-hidden="true">◌</span><strong>{t(language, 'rainfall')}</strong><p>{selectedPlace.rainfall}</p></article>
              <article><span aria-hidden="true">☼</span><strong>{t(language, 'weatherPattern')}</strong><p>{selectedPlace.weather}</p></article>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-section" id="trust">
        <div className="container trust-grid">
          <div>
            <p className="eyebrow">Information you can trust</p>
            <h2>No guesswork.<br /><em>Just clarity.</em></h2>
          </div>
          <div className="trust-points">
            <div><span className="point-icon">◷</span><div><h3>Every record has a source</h3><p>See where information came from, when it was collected, and whether it has been reviewed.</p></div></div>
            <div><span className="point-icon">⌑</span><div><h3>Your information stays yours</h3><p>You choose what to share. Private farm details and precise locations are protected.</p></div></div>
            <div><span className="point-icon">＋</span><div><h3>Farmers help it grow</h3><p>Contribute local observations and help build a stronger knowledge base for your community.</p></div></div>
          </div>
        </div>
      </section>

      <footer className="footer container">
        <a className="brand" href="/"><span className="brand-mark" aria-hidden="true">⌁</span><span>Primary <strong>Key</strong></span></a>
        <p>Reliable agricultural information for a stronger tomorrow.</p>
        <span className="footer-meta">© 2026 Agrinfo</span>
      </footer>
    </main>
  )
}

function SignupPage({ language, onBack, onLogin, onSuccess }: { language: Language; onBack: () => void; onLogin: () => void; onSuccess: (user: User) => void }) {
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', password: '', repeatPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [message, setMessage] = useState('')
  const usernameValid = /^(?=.{6,}$)(?=.*\d)[A-Za-z0-9]+$/.test(form.username)
  const passwordsMatch = form.password.length > 0 && form.password === form.repeatPassword
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!usernameValid || form.password.length < 8 || !passwordsMatch) {
      setMessage('Please correct the highlighted fields before submitting.')
      return
    }
    try {
      const result = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const body = await result.text()
      let payload: { data?: User & { message?: string }; error?: { message?: string } }
      try {
        payload = JSON.parse(body) as { data?: User & { message?: string }; error?: { message?: string } }
      } catch {
        throw new Error('The API did not return a valid response. Start the Agrinfo API on port 4000.')
      }
      if (!result.ok) throw new Error(payload.error?.message ?? 'Signup failed.')
      setMessage(payload.data?.message ?? 'Account created successfully.')
      if (payload.data?.id) onSuccess(payload.data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Signup failed.')
    }
  }
  return (
    <main className="auth-page">
      <nav className="nav container" aria-label="Signup navigation">
        <a className="brand" href="/" aria-label="Agrinfo home"><span className="brand-mark" aria-hidden="true">⌁</span><span>Agr<strong>info</strong></span></a>
        <button className="button button-outline" type="button" onClick={onBack}>← Back</button>
      </nav>
      <section className="signup-card">
        <p className="eyebrow">{localized(language, 'Join Agrinfo', 'Agrinfo-ல் சேருங்கள்', 'Agrinfo में शामिल हों')}</p>
        <h1>Create your account.</h1>
        <p className="auth-intro">Create a secure account to manage your agricultural information and contributions.</p>
        <form className="signup-form" onSubmit={submit}>
          <label>Username<input value={form.username} onChange={(event) => update('username', event.target.value)} aria-invalid={form.username.length > 0 && !usernameValid} autoComplete="username" /><small>At least 6 characters, one number, no spaces or special characters.</small></label>
          <div className="form-row"><label>First name<input value={form.firstName} onChange={(event) => update('firstName', event.target.value)} autoComplete="given-name" /></label><label>Last name<input value={form.lastName} onChange={(event) => update('lastName', event.target.value)} autoComplete="family-name" /></label></div>
          <label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" /></label>
          <label>Password<div className="password-input"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div><small>Use at least 8 characters.</small></label>
          <label>Repeat password<div className={`password-input match-${form.repeatPassword.length === 0 ? 'empty' : passwordsMatch ? 'valid' : 'invalid'}`}><input type={showRepeatPassword ? 'text' : 'password'} value={form.repeatPassword} onChange={(event) => update('repeatPassword', event.target.value)} autoComplete="new-password" /><button type="button" onClick={() => setShowRepeatPassword((value) => !value)}>{showRepeatPassword ? 'Hide' : 'Show'}</button></div>{form.repeatPassword.length > 0 && <small className={passwordsMatch ? 'valid-text' : 'invalid-text'}>{passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'}</small>}</label>
          <button className="button button-primary signup-submit" type="submit">Create account</button>
          <div className="auth-links"><a href="/forgot-password">Forgot password?</a><span>Already have an account? <button type="button" onClick={onLogin}>Login</button></span></div>
          {message && <p className="auth-message" role="status">{message}</p>}
        </form>
      </section>
    </main>
  )
}

function LoginPage({ language, onBack, onSuccess }: { language: Language; onBack: () => void; onSuccess: (user: User) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const result = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const body = await result.text()
      let payload: { data?: User; error?: { message?: string } }
      try {
        payload = JSON.parse(body) as { data?: User; error?: { message?: string } }
      } catch {
        throw new Error('The API did not return a valid response. Start the Agrinfo API on port 4000.')
      }
      if (!result.ok) throw new Error(payload.error?.message ?? 'Login failed.')
      setMessage(`Welcome back, ${payload.data?.username ?? 'farmer'}.`)
      if (payload.data) onSuccess(payload.data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed.')
    }
  }
  return (
    <main className="auth-page">
      <nav className="nav container" aria-label="Login navigation">
        <a className="brand" href="/" aria-label="Agrinfo home"><span className="brand-mark" aria-hidden="true">⌁</span><span>Agr<strong>info</strong></span></a>
        <button className="button button-outline" type="button" onClick={onBack}>← Back</button>
      </nav>
      <section className="signup-card login-card">
        <p className="eyebrow">{localized(language, 'Welcome back', 'மீண்டும் வரவேற்கிறோம்', 'वापसी पर स्वागत है')}</p>
        <h1>Login to Agrinfo.</h1>
        <p className="auth-intro">Use the email and password from your Agrinfo account.</p>
        <form className="signup-form" onSubmit={submit}>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <label>Password<div className="password-input"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
          <button className="button button-primary signup-submit" type="submit">Login</button>
          <div className="auth-links"><a href={`/forgot-password?email=${encodeURIComponent(email)}`}>Forgot password?</a><span>New to Agrinfo? <a href="/signup">Create an account</a></span></div>
          {message && <p className="auth-message" role="status">{message}</p>}
        </form>
      </section>
    </main>
  )
}

function ProfilePage({ language, user, onBack, onSaved }: { language: Language; user: User; onBack: () => void; onSaved: (user: User) => void }) {
  const [form, setForm] = useState(user)
  const [message, setMessage] = useState('')
  const update = (field: keyof User, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const result = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload: { data?: User; error?: { message?: string } } = await result.json()
      if (!result.ok || !payload.data) throw new Error(payload.error?.message ?? 'Could not save your profile.')
      onSaved(payload.data)
      setForm(payload.data)
      setMessage('Profile changes saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your profile.')
    }
  }
  return (
    <main className="auth-page">
      <nav className="nav container" aria-label="Profile navigation">
        <a className="brand" href="/" aria-label="Agrinfo home"><span className="brand-mark" aria-hidden="true">⌁</span><span>Agr<strong>info</strong></span></a>
        <button className="button button-outline" type="button" onClick={onBack}>← Home</button>
      </nav>
      <section className="signup-card login-card">
        <p className="eyebrow">{localized(language, 'Your account', 'உங்கள் கணக்கு', 'आपका खाता')}</p>
        <h1>Profile.</h1>
        <p className="auth-intro">Review or update the personal information connected to your account.</p>
        <form className="signup-form" onSubmit={submit}>
          <label>Username<input value={form.username} onChange={(event) => update('username', event.target.value)} autoComplete="username" /></label>
          <div className="form-row"><label>First name<input value={form.firstName} onChange={(event) => update('firstName', event.target.value)} autoComplete="given-name" /></label><label>Last name<input value={form.lastName} onChange={(event) => update('lastName', event.target.value)} autoComplete="family-name" /></label></div>
          <label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" /></label>
          <label>Account role<input value={form.role} readOnly /></label>
          <button className="button button-primary signup-submit" type="submit">Save changes</button>
          {message && <p className="auth-message" role="status">{message}</p>}
        </form>
      </section>
    </main>
  )
}

function AddInfoPage({ language, onBack }: { language: Language; onBack: () => void }) {
  const [form, setForm] = useState({ name: '', age: '', city: '', state: '', information: '' })
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))
  return (
    <main className="auth-page">
      <nav className="nav container" aria-label="Additional information navigation">
        <a className="brand" href="/" aria-label="Agrinfo home"><span className="brand-mark" aria-hidden="true">⌁</span><span>Agr<strong>info</strong></span></a>
        <button className="button button-outline" type="button" onClick={onBack}>← {localized(language, 'Back to home', 'முகப்புக்குத் திரும்பு', 'होम पर वापस जाएँ')}</button>
      </nav>
      <section className="signup-card">
        <p className="eyebrow">{localized(language, 'Additional information', 'கூடுதல் தகவல்', 'अतिरिक्त जानकारी')}</p>
        <h1>{localized(language, 'Tell us about yourself.', 'உங்களைப் பற்றி சொல்லுங்கள்.', 'अपने बारे में बताएं।')}</h1>
        <p className="auth-intro">{localized(language, 'Fill in the details below to add your farmer information.', 'உங்கள் விவசாயத் தகவலைச் சேர்க்க கீழே உள்ள விவரங்களை நிரப்பவும்.', 'अपनी किसान जानकारी जोड़ने के लिए नीचे दिए गए विवरण भरें।')}</p>
        <form className="signup-form" onSubmit={(event) => event.preventDefault()}>
          <label>Name<input value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" /></label>
          <label>Age<input type="number" min="1" max="120" value={form.age} onChange={(event) => update('age', event.target.value)} /></label>
          <label>City<input value={form.city} onChange={(event) => update('city', event.target.value)} autoComplete="address-level2" /></label>
          <label>State<select value={form.state} onChange={(event) => update('state', event.target.value)}><option value="">Select a state</option>{stateProfiles.map(([state]) => <option key={state} value={state}>{state}</option>)}</select></label>
          <label>Tell us your information<textarea value={form.information} onChange={(event) => update('information', event.target.value)} rows={5} placeholder="Share any information you would like us to know." /></label>
          <p className="form-note">Your information form is ready. Saving this information will be connected next.</p>
        </form>
      </section>
    </main>
  )
}

function ForgotPasswordPage({ language, onBack, onSuccess }: { language: Language; onBack: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get('email') ?? '')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const result = await fetch('/api/auth/password-reset/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const payload: { data?: { message?: string }; error?: { message?: string } } = await result.json()
      if (!result.ok) throw new Error(payload.error?.message ?? 'Could not send OTP.')
      setSent(true)
      setMessage(payload.data?.message ?? 'Check your email for the OTP.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send OTP.')
    }
  }
  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const result = await fetch('/api/auth/password-reset/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) })
      const payload: { data?: { message?: string }; error?: { message?: string } } = await result.json()
      if (!result.ok) throw new Error(payload.error?.message ?? 'OTP verification failed.')
      setMessage(payload.data?.message ?? 'OTP verified.')
      onSuccess()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'OTP verification failed.')
    }
  }
  return (
    <main className="auth-page">
      <nav className="nav container" aria-label="Password reset navigation">
        <a className="brand" href="/" aria-label="Agrinfo home"><span className="brand-mark" aria-hidden="true">⌁</span><span>Agr<strong>info</strong></span></a>
        <button className="button button-outline" type="button" onClick={onBack}>← Back</button>
      </nav>
      <section className="signup-card login-card">
        <p className="eyebrow">{localized(language, 'Account recovery', 'கணக்கு மீட்பு', 'खाता पुनर्प्राप्ति')}</p>
        <h1>Reset access.</h1>
        <p className="auth-intro">Enter your account email and we will send a six-digit OTP.</p>
        <form className="signup-form" onSubmit={requestOtp}>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <button className="button button-primary signup-submit" type="submit">Send OTP</button>
        </form>
        {sent && <form className="signup-form otp-form" onSubmit={verifyOtp}>
          <label>Six-digit OTP<input inputMode="numeric" pattern="\d{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} required /></label>
          <button className="button button-primary signup-submit" type="submit">Verify OTP</button>
        </form>}
        {message && <p className="auth-message" role="status">{message}</p>}
      </section>
    </main>
  )
}

function StateHub({ location, onBack, language }: { location: Location; onBack: () => void; language: Language }) {
  return (
    <main className="state-hub">
      <nav className="nav container" aria-label="State information navigation">
        <a className="brand" href="/" aria-label="Agrinfo home"><span className="brand-mark" aria-hidden="true">⌁</span><span>Agr<strong>info</strong></span></a>
        <button className="button button-outline" type="button" onClick={onBack}>← Back to map</button>
      </nav>
      <section className="state-hero container">
        <p className="eyebrow">{localized(language, 'Agricultural information hub', 'விவசாய தகவல் மையம்', 'कृषि जानकारी केंद्र')}</p>
        <h1>{location.name}</h1>
        <p className="state-description">A quick regional view of the agricultural conditions and information currently available for this state.</p>
        <p className="data-notice"><span aria-hidden="true">ⓘ</span> Regional summary · Verify local recommendations with agricultural officers and current soil tests.</p>
      </section>
      <section className="state-info container">
        <article className="info-panel"><span className="info-panel-icon" aria-hidden="true">▰</span><p className="eyebrow">Soil</p><h2>Soil types</h2><p>{location.soil}</p></article>
        <article className="info-panel"><span className="info-panel-icon" aria-hidden="true">◒</span><p className="eyebrow">Cultivation</p><h2>Common crops</h2><p>{location.crops}</p></article>
        <article className="info-panel"><span className="info-panel-icon" aria-hidden="true">☼</span><p className="eyebrow">Climate</p><h2>Weather pattern</h2><p>{location.weather}</p></article>
        <article className="info-panel"><span className="info-panel-icon" aria-hidden="true">◌</span><p className="eyebrow">Water</p><h2>Rainfall</h2><p>{location.rainfall}</p></article>
      </section>
      <section className="state-next container">
        <div><p className="eyebrow">More information coming</p><h2>Build a clearer picture of this region.</h2><p>Verified district-level soil tests, weather observations, seed varieties, and market information will be added as trusted data sources are connected.</p></div>
        <a className="button button-primary" href="/#explore">Search another area</a>
      </section>
      <StateTopicDetails topics={stateTopics[location.name]} />
    </main>
  )
}

function StateTopicDetails({ topics }: { topics: StateTopics | undefined }) {
  if (!topics) return null
  const sections = [
    { title: 'Soil', label: 'What it is, benefits & how it formed', icon: '▰', what: topics.soil.what, benefits: topics.soil.benefits, formed: topics.soil.formed },
    { title: 'Crops', label: 'What grows here & why it matters', icon: '◒', what: topics.crops.what, benefits: topics.crops.benefits },
    { title: 'Weather', label: 'Regional climate & farming value', icon: '☼', what: topics.weather.what, benefits: topics.weather.benefits },
    { title: 'Water and irrigation', label: 'Main water sources & benefits', icon: '◌', what: topics.water.what, benefits: topics.water.benefits },
  ]
  return (
    <section className="state-topic-details container">
      <div className="topic-heading"><p className="eyebrow">Regional guide</p><h2>Key agricultural information</h2><p>These are broad regional summaries. Local soil tests, weather records, and agricultural officers should guide farm-specific decisions.</p></div>
      <div className="topic-grid">
        {sections.map((section) => (
          <article className="topic-card" key={section.title}>
            <span className="info-panel-icon" aria-hidden="true">{section.icon}</span>
            <p className="eyebrow">{section.title}</p>
            <h3>{section.label}</h3>
            <dl><dt>What it is</dt><dd>{section.what}</dd><dt>Benefits</dt><dd>{section.benefits}</dd>{section.formed && <><dt>How it was formed</dt><dd>{section.formed}</dd></>}</dl>
          </article>
        ))}
      </div>
      <div className="topic-extra">
        <div><p className="eyebrow">Farming calendar</p><h3>Important seasons</h3><p>{topics.seasons}</p></div>
        <div><p className="eyebrow">Practical note</p><h3>Good starting practice</h3><p>{topics.practice}</p></div>
      </div>
    </section>
  )
}

export default App
