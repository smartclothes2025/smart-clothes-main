// src/mock/clothesMockData.js
// Mock data for clothes/wardrobe items

export const MOCK_CLOTHES = [
  {
    id: "1",
    name: "白色襯衫",
    category: "上衣",
    color: "白色",
    brand: "Uniqlo",
    season: "春夏",
    image: "/src/assets/whiteshirt.png",
    tags: ["正式", "商務"],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    name: "黑色西裝褲",
    category: "褲子",
    color: "黑色",
    brand: "Zara",
    season: "四季",
    image: "/src/assets/blackpants.png",
    tags: ["正式", "商務"],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "3",
    name: "藍色牛仔褲",
    category: "褲子",
    color: "藍色",
    brand: "Levi's",
    season: "四季",
    image: "/src/assets/bluejeans.png",
    tags: ["休閒"],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "4",
    name: "黑色洋裝",
    category: "洋裝",
    color: "黑色",
    brand: "H&M",
    season: "春夏",
    image: "/src/assets/blackdress.png",
    tags: ["正式", "派對"],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "5",
    name: "A字短裙",
    category: "裙子",
    color: "灰色",
    brand: "Forever 21",
    season: "春夏",
    image: "/src/assets/alineshirt.png",
    tags: ["休閒", "可愛"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "6",
    name: "條紋T恤",
    category: "上衣",
    color: "黑白",
    brand: "Gap",
    season: "春夏",
    image: "/src/assets/stripedtee.png",
    tags: ["休閒"],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "7",
    name: "牛仔外套",
    category: "外套",
    color: "藍色",
    brand: "Levi's",
    season: "春秋",
    image: "/src/assets/denimjacket.png",
    tags: ["休閒"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "8",
    name: "紅色毛衣",
    category: "上衣",
    color: "紅色",
    brand: "Zara",
    season: "秋冬",
    image: "/src/assets/redsweater.png",
    tags: ["休閒", "溫暖"],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "9",
    name: "黑色皮夾克",
    category: "外套",
    color: "黑色",
    brand: "All Saints",
    season: "秋冬",
    image: "/src/assets/leatherjacket.png",
    tags: ["時尚", "帥氣"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "10",
    name: "卡其短褲",
    category: "褲子",
    color: "卡其色",
    brand: "Uniqlo",
    season: "春夏",
    image: "/src/assets/khakishorts.png",
    tags: ["休閒", "運動"],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock API helpers with delay simulation
function withDelay(data, ms = 200) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const MockClothesApi = {
  // Get all clothes
  getAllClothes: (delayMs = 200) => withDelay(MOCK_CLOTHES, delayMs),
  
  // Get clothes by ID
  getClothesById: (id, delayMs = 150) => 
    withDelay(MOCK_CLOTHES.find((item) => item.id === id) || null, delayMs),
  
  // Get clothes by category
  getClothesByCategory: (category, delayMs = 200) =>
    withDelay(MOCK_CLOTHES.filter((item) => item.category === category), delayMs),
  
  // Get clothes by season
  getClothesBySeason: (season, delayMs = 200) =>
    withDelay(MOCK_CLOTHES.filter((item) => item.season.includes(season)), delayMs),
};

export default MOCK_CLOTHES;
