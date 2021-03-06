var TITLE = 'シンプルローグライク';

var TEXT_VERSION = 'バージョン';
var TEXT_START = 'はじめる';
var TEXT_START_AI = 'はじめる（AI）';
var TEXT_PLAYER = 'あなた';
var TEXT_DEPTH = '階';
var TEXT_LEVEL = 'レベル';
var TEXT_HP = 'HP';
var TEXT_ENERGY = '満腹度';
var TEXT_WEIGHT = 'アイテム重量';
var TEXT_ATK = '攻撃力';
var TEXT_DEF = '防御力';
var TEXT_EXP = '経験値';
var TEXT_STATES = '状態';
var TEXT_HUNGRY = '空腹';
var TEXT_FAMINE = '飢餓';
var TEXT_POISON = '毒';
var TEXT_EYE = '罠見え';
var TEXT_EQUIPPED = '装備中';
var TEXT_AUTO = '自動';
var TEXT_AI = 'AI';
var TEXT_SPEED = '倍速';
var TEXT_COUNT = '回目';
var TEXT_GENERATE_STATS = '情報を収集中です。';
var TEXT_SAVE_CLIPBOARD = 'クリップボードに保存しました。';
var TEXT_ABSTRACT = '概要';
var TEXT_SUMMARY = '集計';
var TEXT_DETAIL = '詳細';
var TEXT_PER = '別';
var TEXT_DIE = '死亡時';
var TEXT_DIE_REASON = '死因';
var TEXT_ACTION = '行動';
var TEXT_MOVE = '移動';
var TEXT_ATTACK = '攻撃';
var TEXT_REST = '休憩';
var TEXT_PICKUP = '取得';
var TEXT_PUT = '破棄';
var TEXT_USE = '使用';
var TEXT_FIGHT = '戦闘';
var TEXT_KILL = '死亡';
var TEXT_ID = '識別子';
var TEXT_NAME = '名称';
var TEXT_LEVEL = 'レベル';
var TEXT_EXP = '経験値';
var TEXT_IN_DAMAGE = '被ダメージ';
var TEXT_OUT_DAMAGE = '与ダメージ';
var TEXT_PROPERTY = '属性';
var TEXT_VALUE = '値';
var TEXT_NUM = '数';
var TEXT_SUM = '合計';
var TEXT_MIN = '最小';
var TEXT_MAX = '最大';
var TEXT_AVG = '平均';
var TEXT_DIFF = '差';
var TEXT_PERCENTAGE = '割合';
var TEXT_DISTRIBUTION = '分布';

var MSG_INIT = ({name}) => `${name}は目覚めました。`;
var MSG_DIE = ({name}) => `${name}は倒れました。`;
var MSG_NO_EFFECT = '何も起きませんでした。';
var MSG_DAMAGE = ({name, dam}) => `${name}は${dam}のダメージを受けました。`;
var MSG_POISON_DAMAGE = ({name, dam}) => `${name}は毒で${dam}のダメージを受けました。`;
var MSG_TRAP = ({name, tname}) => `${name}は${tname}を踏みました。`;
var MSG_TRAP_BREAK = ({tname}) => `${tname}は壊れました。`;
var MSG_HP_RECOVERY = ({name, diff}) => `${name}はHPが${diff}回復しました。`;
var MSG_HP_UP = ({name, diff}) => `${name}は最大HPが${diff}上昇しました。`;
var MSG_ENEGY_RECOVERY = ({name, diff}) => `${name}は満腹度が${diff}回復しました。`;
var MSG_ENEGY_DECREASE = ({name, diff}) => `${name}は満腹度が${diff}減少しました。`;
var MSG_ATK_INCREASE = ({name, diff}) => `${name}は攻撃力が${diff}増加しました。`;
var MSG_ATK_DECREASE = ({name, diff}) => `${name}は攻撃力が${diff}減少しました。`;
var MSG_DEF_INCREASE = ({name, diff}) => `${name}は防御力が${diff}増加しました。`;
var MSG_DEF_DECREASE = ({name, diff}) => `${name}は防御力が${diff}減少しました。`;
var MSG_EXP = ({name, exp}) => `${name}は${exp}の経験値を得ました。`;
var MSG_LEVELUP = ({name, level}) => `${name}はレベル${level}になりました。`;
var MSG_POISON = ({name}) => `${name}は毒に侵されました。`;
var MSG_POISON_RECOVERY = ({name}) => `${name}は毒が抜けました。`;
var MSG_EYE = ({name}) => `${name}は罠が見えるようになりました。`;
var MSG_EYE_DISAPPEARANCE = ({name}) => `${name}は罠が見えなくなりました。`;
var MSG_EQUIPPED_WEAPON_UP = ({name, diff}) => `${name}が装備している武器の攻撃力が${diff}上昇しました。`;
var MSG_EQUIPPED_ARMOR_UP = ({name, diff}) => `${name}が装備している防具の防御力が${diff}上昇しました。`;
var MSG_WALL = '壁に阻まれました。';
var MSG_ATTACK = ({name}) => `${name}は攻撃しました。`;
var MSG_POISON_ATTACK = ({name, dam}) => `${name}は毒を吐きました。`;
var MSG_PICKUP = ({name, iname}) => `${name}は${iname}を拾いました。`;
var MSG_CANT_PICKUP = ({iname}) => `${iname}を拾おうとしましたが、持ちきれませんでした。`;
var MSG_DOWNSTAIR = ({name}) => `${name}は下り階段を降りました。`;
var MSG_REST = ({name}) => `${name}はほんの少しの間休憩しました。`;
var MSG_HURL = ({name, iname}) => `${name}は${iname}を投げました。`;
var MSG_PUT = ({name, iname}) => `${name}は${iname}を置きました。`;
var MSG_EAT = ({name, iname}) => `${name}は${iname}を食べました。`;
var MSG_QUAFF = ({name, iname}) => `${name}は${iname}を飲みました。`;
var MSG_EQUIP = ({name, iname}) => `${name}は${iname}を装備しました。`;
var MSG_UNEQUIP = ({name, iname}) => `${name}は${iname}を外しました。`;
var MSG_READ = ({name, iname}) => `${name}は${iname}を読みました。`;
var MSG_ENERGY20 = 'お腹が減ってきました。';
var MSG_ENERGY10 = 'お腹がペコペコです。';
var MSG_ENERGY0 = 'お腹が減って死にそうです。';
var MSG_EMPTY_INV = '何も持っていません。';

var E_RAT_NAME = 'ネズミ';
var E_BAT_NAME = 'コウモリ';
var E_SLIME_NAME = 'スライム';
var E_SPIDER_NAME = 'クモ';
var E_SNAKE_NAME = 'ヘビ';
var E_CARACAL_NAME = 'カラカル';
var E_WOLF_NAME = 'オオカミ';
var E_GOBLIN_NAME = 'ゴブリン';

var T_HP_RECOVERY_NAME = '回復の罠';
var T_DAMAGE_NAME = 'ダメージの罠';
var T_ENERGY_DECREASE_NAME = '腹減りの罠';

var I_APPLE_NAME = 'リンゴ';
var I_HEALTH_POTION_NAME = '回復薬';
var I_HP_UP_POTION_NAME = '命の薬';
var I_POISON_POTION_NAME = '毒薬';
var I_ANTIDOTE_POTION_NAME = '解毒薬';
var I_EYE_POTION_NAME = '目薬';
var I_DAGGER_NAME = 'ダガー';
var I_SHORT_SWORD_NAME = 'ショートソード';
var I_RAPIER_NAME = 'レイピア';
var I_FALCHION_NAME = 'ファルシオン';
var I_LONG_SWORD_NAME = 'ロングソード';
var I_LEATHER_ARMOR_NAME = 'レザーアーマー';
var I_RIVET_ARMOR_NAME = 'リベットアーマー';
var I_SCALE_ARMOR_NAME = 'スケールアーマー';
var I_CHAIN_MAIL_NAME = 'チェーンメール';
var I_PLATE_ARMOR_NAME = 'プレートアーマー';
var I_WEAPON_SCROLL_NAME = '武器強化の巻物';
var I_ARMOR_SCROLL_NAME = '防具強化の巻物';

var ACTION_EAT = '食べる';
var ACTION_QUAFF = '飲む';
var ACTION_EQUIP = '装備する';
var ACTION_UNEQUIP = '外す';
var ACTION_READ = '読む';
var ACTION_HURL = '投げる';
var ACTION_PUT = '置く';

var SCREEN_X = 1600;
var SCREEN_Y = 800;

var SX = 15;
var SY = 15;
var PX = 48;
var PY = 48;

var MAP_WIDTH = 256;
var MAP_HEIGHT = 256;

var DIR_UP = 0;
var DIR_DOWN = 1;
var DIR_LEFT = 2;
var DIR_RIGHT = 3;
var DIR_UP_LEFT = 4;
var DIR_UP_RIGHT = 5;
var DIR_DOWN_LEFT = 6;
var DIR_DOWN_RIGHT = 7;

var OBJ_ENEMY = 0;
var OBJ_ITEM = 1;

var E_RAT = 0;
var E_BAT = 1;
var E_SLIME = 2;
var E_SPIDER = 3;
var E_SNAKE = 4;
var E_CARACAL = 5;
var E_WOLF = 6;
var E_GOBLIN = 7;

var ATTACK_NORMAL = 0;
var ATTACK_POISON = 1;

var E_INFO = [];
E_INFO[E_RAT] = {
	dname: E_RAT_NAME,
	level: 1,
	hp: 4,
	atk: 3,
	def: 3,
	exp: 1, 
	attacks: [
		{ type: ATTACK_NORMAL, p: 100 }
	]
};
E_INFO[E_BAT] = {
	dname: E_BAT_NAME,
	level: 1,
	hp: 6,
	atk: 4,
	def: 4,
	exp: 2, 
	attacks: [
		{ type: ATTACK_NORMAL, p: 100 }
	]
};
E_INFO[E_SLIME] = {
	dname: E_SLIME_NAME,
	level: 1,
	hp: 8,
	atk: 4,
	def: 4,
	exp: 3, 
	attacks: [
		{ type: ATTACK_NORMAL, p: 100 }
	]
};
E_INFO[E_SPIDER] = {
	dname: E_SPIDER_NAME,
	level: 1,
	hp: 10,
	atk: 5,
	def: 4,
	exp: 4, 
	attacks: [
		{ type: ATTACK_NORMAL, p: 90 }, 
		{ type: ATTACK_POISON, p: 10 }
	]
};
E_INFO[E_SNAKE] = {
	dname: E_SNAKE_NAME,
	level: 1,
	hp: 14,
	atk: 6,
	def: 5,
	exp: 5, 
	attacks: [
		{ type: ATTACK_NORMAL, p: 80 }, 
		{ type: ATTACK_POISON, p: 20 }
	]
};
E_INFO[E_CARACAL] = {
	dname: E_CARACAL_NAME,
	level: 1,
	hp: 16,
	atk: 6,
	def: 6,
	exp: 6, 
	attacks: [
		{ type: ATTACK_NORMAL, p: 100 }
	]
};
E_INFO[E_WOLF] = {
	dname: E_WOLF_NAME,
	level: 1,
	hp: 20,
	atk: 7,
	def: 7,
	exp: 8, 
	attacks: [
		{ type: ATTACK_NORMAL, p: 100 }
	]
};
E_INFO[E_GOBLIN] = {
	dname: E_GOBLIN_NAME,
	level: 1,
	hp: 24,
	atk: 8,
	def: 8,
	exp: 10, 
	attacks: [
		{ type: ATTACK_NORMAL, p: 100 }
	]
};

var T_HP_RECOVERY = 0;
var T_DAMAGE = 1;
var T_ENERGY_DECREASE = 2;

var T_INFO = [];
T_INFO[T_HP_RECOVERY] = {
	dname: T_HP_RECOVERY_NAME, 
	break: 1.0
};
T_INFO[T_DAMAGE] = {
	dname: T_DAMAGE_NAME, 
	break: 0.3
};
T_INFO[T_ENERGY_DECREASE] = {
	dname: T_ENERGY_DECREASE_NAME, 
	break: 0.3
};

var B_FLOOR = 0;
var B_WALL = 1;
var B_DOWNSTAIR = 2;

var B_CAN_STAND = [];
B_CAN_STAND[B_FLOOR] = true;
B_CAN_STAND[B_WALL] = false;
B_CAN_STAND[B_DOWNSTAIR] = true;

var M_UNKNOWN = 65535;

var I_APPLE = 0;
var I_HEALTH_POTION = 100;
var I_HP_UP_POTION = 150;
var I_POISON_POTION = 170;
var I_ANTIDOTE_POTION = 171;
var I_EYE_POTION = 172;
var I_DAGGER = 200;
var I_SHORT_SWORD = 201;
var I_RAPIER = 202;
var I_FALCHION = 203;
var I_LONG_SWORD = 204;
var I_LEATHER_ARMOR = 300;
var I_RIVET_ARMOR = 301;
var I_SCALE_ARMOR = 302;
var I_CHAIN_MAIL = 303;
var I_PLATE_ARMOR = 304;
var I_WEAPON_SCROLL = 400;
var I_ARMOR_SCROLL = 401;

var I_INFO = [];
I_INFO[I_APPLE] = {
	dname: I_APPLE_NAME,
	weight: 0.1
};
I_INFO[I_HEALTH_POTION] = {
	dname: I_HEALTH_POTION_NAME,
	weight: 0.1
};
I_INFO[I_HP_UP_POTION] = {
	dname: I_HP_UP_POTION_NAME, 
	weight: 0.1
};
I_INFO[I_POISON_POTION] = {
	dname: I_POISON_POTION_NAME, 
	weight: 0.1
};
I_INFO[I_ANTIDOTE_POTION] = {
	dname: I_ANTIDOTE_POTION_NAME, 
	weight: 0.1
};
I_INFO[I_EYE_POTION] = {
	dname: I_EYE_POTION_NAME, 
	weight: 0.1
};
I_INFO[I_DAGGER] = {
	level: 1,
	dname: I_DAGGER_NAME,
	weight: 0.3,
	atk: 1
};
I_INFO[I_SHORT_SWORD] = {
	level: 2,
	dname: I_SHORT_SWORD_NAME,
	weight: 0.5,
	atk: 2
};
I_INFO[I_RAPIER] = {
	level: 3,
	dname: I_RAPIER_NAME,
	weight: 0.5,
	atk: 3
};
I_INFO[I_FALCHION] = {
	level: 4,
	dname: I_FALCHION_NAME,
	weight: 0.8,
	atk: 4
};
I_INFO[I_LONG_SWORD] = {
	level: 5,
	dname: I_LONG_SWORD_NAME,
	weight: 0.7,
	atk: 5
};
I_INFO[I_LEATHER_ARMOR] = {
	level: 1,
	dname: I_LEATHER_ARMOR_NAME,
	weight: 0.4,
	def: 1
};
I_INFO[I_RIVET_ARMOR] = {
	level: 2,
	dname: I_RIVET_ARMOR_NAME,
	weight: 0.6,
	def: 2
};
I_INFO[I_SCALE_ARMOR] = {
	level: 3,
	dname: I_SCALE_ARMOR_NAME,
	weight: 0.7,
	def: 3
};
I_INFO[I_CHAIN_MAIL] = {
	level: 4,
	dname: I_CHAIN_MAIL_NAME,
	weight: 0.8,
	def: 4
};
I_INFO[I_PLATE_ARMOR] = {
	level: 5,
	dname: I_PLATE_ARMOR_NAME,
	weight: 0.8,
	def: 5
};
I_INFO[I_WEAPON_SCROLL] = {
	dname: I_WEAPON_SCROLL_NAME,
	weight: 0.1
};
I_INFO[I_ARMOR_SCROLL] = {
	dname: I_ARMOR_SCROLL_NAME,
	weight: 0.1
};

var I_CAT_FOOD = 0;
var I_CAT_POTION = 1;
var I_CAT_WEAPON = 2;
var I_CAT_ARMOR = 3;
var I_CAT_SCROLL = 4;

var NUM_MESSAGE = 8;
