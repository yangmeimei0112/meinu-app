import { RecognizedItem } from './AdminAiMenuReviewTable';

// 🥤 示範用手搖飲料菜單範本
export const MOCK_BEVERAGE_ITEMS: RecognizedItem[] = [
  {
    tempId: 'mock_1',
    name: '珍珠奶茶',
    price: 50,
    description: '經典慢火熬煮黑糖波霸搭配香醇奶茶',
    category: '招牌特調',
    is_sold_out: false,
    selected: true,
    custom_groups: [
      {
        id: 'cg_sweet_1',
        title: '甜度選擇',
        type: 'single',
        options: [
          { id: 'opt_s1', name: '正常甜 (100%)', price: 0 },
          { id: 'opt_s2', name: '少糖 (70%)', price: 0 },
          { id: 'opt_s3', name: '半糖 (50%)', price: 0 },
          { id: 'opt_s4', name: '微糖 (30%)', price: 0, is_default: true },
          { id: 'opt_s5', name: '無糖 (0%)', price: 0 },
        ],
      },
      {
        id: 'cg_ice_1',
        title: '冰塊選擇',
        type: 'single',
        options: [
          { id: 'opt_i1', name: '正常冰', price: 0 },
          { id: 'opt_i2', name: '少冰', price: 0, is_default: true },
          { id: 'opt_i3', name: '微冰', price: 0 },
          { id: 'opt_i4', name: '去冰', price: 0 },
        ],
      },
      {
        id: 'cg_add_1',
        title: '加料專區',
        type: 'multiple',
        options: [
          { id: 'opt_a1', name: '黑糖波霸', price: 10 },
          { id: 'opt_a2', name: '椰果', price: 10 },
          { id: 'opt_a3', name: '仙草凍', price: 10 },
        ],
      },
    ],
  },
  {
    tempId: 'mock_2',
    name: '四季春茶',
    price: 35,
    description: '嚴選南投高山四季春，茶韻甘醇不澀口',
    category: '原葉純茶',
    is_sold_out: false,
    selected: true,
    custom_groups: [
      {
        id: 'cg_sweet_2',
        title: '甜度選擇',
        type: 'single',
        options: [
          { id: 'opt_s21', name: '微糖 (30%)', price: 0, is_default: true },
          { id: 'opt_s22', name: '無糖 (0%)', price: 0 },
        ],
      },
      {
        id: 'cg_ice_2',
        title: '冰塊選擇',
        type: 'single',
        options: [
          { id: 'opt_i21', name: '少冰', price: 0, is_default: true },
          { id: 'opt_i22', name: '去冰', price: 0 },
        ],
      },
    ],
  },
  {
    tempId: 'mock_3',
    name: '紅茶拿鐵 (鮮奶茶)',
    price: 60,
    description: '斯里蘭卡莊園紅茶與濃醇鮮乳黃金比例',
    category: '鮮奶拿鐵',
    is_sold_out: false,
    selected: true,
    custom_groups: [],
  },
  {
    tempId: 'mock_4',
    name: '鮮橙翡翠綠',
    price: 65,
    description: '新鮮柳橙鮮榨原汁與清香翡翠綠茶',
    category: '鮮果鮮茶',
    is_sold_out: false,
    selected: true,
    custom_groups: [],
  },
];

// 🍱 示範用便當快餐菜單範本
export const MOCK_BENTO_ITEMS: RecognizedItem[] = [
  {
    tempId: 'mock_b1',
    name: '招牌酥炸排骨便當',
    price: 110,
    description: '現炸厚切秘製排骨，附三樣當季配菜與滷蛋',
    category: '人氣便當',
    is_sold_out: false,
    selected: true,
    custom_groups: [
      {
        id: 'cg_rice_1',
        title: '飯量選擇',
        type: 'single',
        options: [
          { id: 'opt_r1', name: '正常飯量', price: 0, is_default: true },
          { id: 'opt_r2', name: '大份加飯', price: 10 },
          { id: 'opt_r3', name: '少飯 (減醣)', price: 0 },
        ],
      },
      {
        id: 'cg_side_1',
        title: '附餐升級',
        type: 'single',
        options: [
          { id: 'opt_sd1', name: '當日例湯', price: 0, is_default: true },
          { id: 'opt_sd2', name: '冰檸檬紅茶', price: 15 },
        ],
      },
    ],
  },
  {
    tempId: 'mock_b2',
    name: '經典香酥大雞腿飯',
    price: 125,
    description: '黃金酥脆超大份量鮮嫩雞腿，皮脆多汁',
    category: '人氣便當',
    is_sold_out: false,
    selected: true,
    custom_groups: [],
  },
  {
    tempId: 'mock_b3',
    name: '泰式椒麻雞便當',
    price: 120,
    description: '特調酸辣椒麻醬汁，去骨雞腿酥脆可口',
    category: '特色主廚',
    is_sold_out: false,
    selected: true,
    custom_groups: [],
  },
];
