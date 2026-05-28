import React, { useState, useEffect, useMemo } from "react";
import {
  Home, ListChecks, CalendarDays, Flame, BarChart3, Timer,
  Search, Plus, Check, Trash2, Play, Pause, RotateCcw,
  Dumbbell, Briefcase, Brain, Target, Droplet,
  BookOpen, Wind, Smartphone, ChevronLeft, ChevronRight, Zap, Leaf, Pencil,
  BellRing, BellOff, Repeat, Apple, X
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar as ReBar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

/* ----------------------------- config ----------------------------- */
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const todayIdx = (new Date().getDay() + 6) % 7;
const monthDay = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long" });
const todayKey = () => new Date().toISOString().slice(0, 10);

const CATS = {
  fisico:     { label: "Físico",     Icon: Dumbbell,  color: "#34d399" },
  negocios:   { label: "Negocios",   Icon: Briefcase, color: "#2dd4bf" },
  estudio:    { label: "Estudio IA", Icon: Brain,     color: "#5eead4" },
  disciplina: { label: "Disciplina", Icon: Target,    color: "#86efac" },
};

const HABIT_ICONS = {
  book: BookOpen, wind: Wind, phone: Smartphone, water: Droplet,
  gym: Dumbbell, leaf: Leaf, target: Target, brain: Brain,
};
const habitIcon = (key) => HABIT_ICONS[key] || Leaf;

const REPEAT_OPTS = [
  { id: "once",     label: "Solo este día",   days: null },
  { id: "weekdays", label: "Lun a Vie",       days: [0,1,2,3,4] },
  { id: "weekend",  label: "Fin de semana",   days: [5,6] },
  { id: "daily",    label: "Todos los días",  days: [0,1,2,3,4,5,6] },
];

/* ----------------------------- RUTINA DE GYM (editable) ----------------------------- */
/* Estructura: array de "días de rutina". Cada día tiene id, name, focus, weekday (0-6 o null si suelto),
   rest (bool), y exs[] con {id, n, sets, reps}. El usuario puede crear/editar/borrar todo. */
let _gid = 1;
const gx = (n, sets, reps) => ({ id: `e${Date.now()}_${_gid++}`, n, sets, reps });
const SEED_GYM = [
  { id: "d1", name: "Push", focus: "Pecho · Hombro · Tríceps", weekday: 0, rest: false, exs: [
    gx("Press banca plano", 4, "6-8"),
    gx("Press inclinado mancuerna", 3, "8-10"),
    gx("Aperturas inclinadas", 3, "12"),
    gx("Press militar mancuerna", 3, "8-10"),
    gx("Elevaciones laterales", 4, "15"),
    gx("Tríceps polea cuerda", 3, "12"),
    gx("Fondos asistidos o libres", 3, "fallo"),
  ]},
  { id: "d2", name: "Pull", focus: "Espalda · Bíceps", weekday: 1, rest: false, exs: [
    gx("Dominadas (asistidas si hace falta)", 4, "fallo"),
    gx("Remo barra", 4, "8"),
    gx("Jalón al pecho", 3, "10"),
    gx("Remo sentado polea", 3, "12"),
    gx("Face pulls", 4, "15"),
    gx("Curl barra", 3, "10"),
    gx("Curl martillo", 3, "12"),
  ]},
  { id: "d3", name: "Piernas + Core", focus: "Cuádriceps · Femoral · Abs", weekday: 2, rest: false, exs: [
    gx("Sentadilla", 4, "6-8"),
    gx("Prensa", 4, "12"),
    gx("Peso muerto rumano", 3, "10"),
    gx("Curl femoral", 3, "12"),
    gx("Extensiones cuádriceps", 3, "15"),
    gx("Gemelos", 4, "15"),
    gx("Crunch polea", 3, "15"),
    gx("Plancha", 3, "rounds"),
  ]},
  { id: "d4", name: "Descanso", focus: "Caminata · movilidad · agua · sueño", weekday: 3, rest: true, exs: [] },
  { id: "d5", name: "Push B", focus: "Enfoque hombro aesthetic", weekday: 4, rest: false, exs: [
    gx("Press inclinado barra", 4, "8"),
    gx("Press hombro mancuerna", 3, "10"),
    gx("Elevaciones laterales", 5, "15"),
    gx("Elevaciones posteriores", 4, "15"),
    gx("Cruce poleas", 3, "15"),
    gx("Tríceps cuerda", 3, "15"),
  ]},
  { id: "d6", name: "Pull B + Pierna", focus: "Espalda ancha · Glúteo", weekday: 5, rest: false, exs: [
    gx("Dominadas", 4, "fallo"),
    gx("Pullover polea", 3, "15"),
    gx("Jalón unilateral", 3, "12"),
    gx("Curl inclinado", 3, "12"),
    gx("Bulgarian split squat", 3, "12"),
    gx("Gemelos", 4, "20"),
    gx("Ab wheel", 3, "12"),
  ]},
  { id: "d7", name: "Descanso", focus: "Descanso total", weekday: 6, rest: true, exs: [] },
];

/* ----------------------------- BASE DE ALIMENTOS (Argentina) ----------------------------- */
/* kcal, proteína, grasa, carbohidrato — todos por 100g salvo que diga unidad */
const FOOD_DB = [
  // Carnes
  { id: "carne_asado", name: "Asado vacuno", cat: "carne", kcal: 290, p: 22, f: 22, c: 0 },
  { id: "carne_vacio", name: "Vacío", cat: "carne", kcal: 260, p: 24, f: 19, c: 0 },
  { id: "carne_peceto", name: "Peceto", cat: "carne", kcal: 165, p: 28, f: 6, c: 0 },
  { id: "carne_bife", name: "Bife de chorizo", cat: "carne", kcal: 250, p: 26, f: 17, c: 0 },
  { id: "carne_lomo", name: "Lomo", cat: "carne", kcal: 175, p: 27, f: 8, c: 0 },
  { id: "carne_nalga", name: "Nalga", cat: "carne", kcal: 170, p: 26, f: 7, c: 0 },
  { id: "carne_picada", name: "Carne picada común", cat: "carne", kcal: 250, p: 20, f: 19, c: 0 },
  { id: "carne_milanesa", name: "Milanesa de carne (cocida)", cat: "carne", kcal: 280, p: 22, f: 16, c: 12 },
  { id: "pollo_pechuga", name: "Pechuga de pollo", cat: "carne", kcal: 165, p: 31, f: 3.6, c: 0 },
  { id: "pollo_muslo", name: "Muslo de pollo (sin piel)", cat: "carne", kcal: 175, p: 25, f: 8, c: 0 },
  { id: "pollo_pata", name: "Pata-muslo con piel", cat: "carne", kcal: 220, p: 22, f: 14, c: 0 },
  { id: "pollo_milanesa", name: "Milanesa de pollo", cat: "carne", kcal: 240, p: 25, f: 12, c: 10 },
  { id: "cerdo_lomo", name: "Lomo de cerdo", cat: "carne", kcal: 195, p: 27, f: 9, c: 0 },
  { id: "cerdo_bondiola", name: "Bondiola", cat: "carne", kcal: 280, p: 22, f: 22, c: 0 },
  { id: "panceta", name: "Panceta", cat: "carne", kcal: 540, p: 13, f: 53, c: 1 },
  { id: "chorizo", name: "Chorizo (1 unidad ~100g)", cat: "carne", kcal: 320, p: 14, f: 28, c: 2 },
  { id: "morcilla", name: "Morcilla", cat: "carne", kcal: 380, p: 14, f: 35, c: 1 },
  { id: "salchicha", name: "Salchicha", cat: "carne", kcal: 300, p: 11, f: 27, c: 3 },
  { id: "jamon_cocido", name: "Jamón cocido", cat: "carne", kcal: 145, p: 18, f: 7, c: 1 },
  { id: "jamon_crudo", name: "Jamón crudo", cat: "carne", kcal: 270, p: 28, f: 17, c: 0 },
  { id: "salame", name: "Salame", cat: "carne", kcal: 425, p: 22, f: 37, c: 1 },
  { id: "atun_lata", name: "Atún en agua (lata)", cat: "carne", kcal: 115, p: 26, f: 1, c: 0 },
  { id: "atun_aceite", name: "Atún en aceite (lata, escurrido)", cat: "carne", kcal: 190, p: 26, f: 9, c: 0 },
  { id: "merluza", name: "Merluza", cat: "carne", kcal: 90, p: 18, f: 1.5, c: 0 },
  { id: "salmon", name: "Salmón", cat: "carne", kcal: 210, p: 22, f: 13, c: 0 },

  // Almidones y panes
  { id: "arroz", name: "Arroz blanco cocido", cat: "almidon", kcal: 130, p: 2.7, f: 0.3, c: 28 },
  { id: "arroz_integral", name: "Arroz integral cocido", cat: "almidon", kcal: 125, p: 2.6, f: 1, c: 26 },
  { id: "arroz_crudo", name: "Arroz crudo", cat: "almidon", kcal: 365, p: 7, f: 1, c: 80 },
  { id: "fideos", name: "Fideos cocidos", cat: "almidon", kcal: 130, p: 5, f: 1, c: 25 },
  { id: "fideos_crudos", name: "Fideos secos", cat: "almidon", kcal: 365, p: 13, f: 1.5, c: 75 },
  { id: "papa", name: "Papa hervida", cat: "almidon", kcal: 87, p: 1.9, f: 0.1, c: 20 },
  { id: "papa_frita", name: "Papas fritas", cat: "almidon", kcal: 320, p: 4, f: 17, c: 38 },
  { id: "pure", name: "Puré de papa", cat: "almidon", kcal: 110, p: 2, f: 4, c: 17 },
  { id: "batata", name: "Batata hervida", cat: "almidon", kcal: 90, p: 1.6, f: 0.1, c: 21 },
  { id: "polenta", name: "Polenta cocida", cat: "almidon", kcal: 95, p: 2, f: 0.4, c: 21 },
  { id: "pan_lactal", name: "Pan lactal (rebanada ~25g)", cat: "almidon", kcal: 265, p: 9, f: 3.5, c: 50, unit: "rebanada", unitG: 25 },
  { id: "pan_frances", name: "Pan francés", cat: "almidon", kcal: 280, p: 9, f: 1, c: 58 },
  { id: "pan_arabe", name: "Pan árabe", cat: "almidon", kcal: 275, p: 9, f: 1, c: 55 },
  { id: "pan_rallado", name: "Pan rallado", cat: "almidon", kcal: 380, p: 13, f: 4, c: 72 },
  { id: "tostadas", name: "Tostadas (rebanada ~10g)", cat: "almidon", kcal: 400, p: 10, f: 5, c: 75, unit: "rebanada", unitG: 10 },
  { id: "galletitas_agua", name: "Galletitas de agua", cat: "almidon", kcal: 430, p: 10, f: 12, c: 70 },
  { id: "tortilla_trigo", name: "Tortilla de trigo (rap)", cat: "almidon", kcal: 305, p: 8, f: 7, c: 52 },
  { id: "avena", name: "Avena (en seco)", cat: "almidon", kcal: 380, p: 13, f: 7, c: 67 },
  { id: "harina_trigo", name: "Harina de trigo", cat: "almidon", kcal: 365, p: 10, f: 1, c: 76 },
  { id: "tapa_empanada", name: "Tapa de empanada (1u ~25g)", cat: "almidon", kcal: 290, p: 7, f: 7, c: 50, unit: "tapa", unitG: 25 },

  // Lácteos y huevos
  { id: "leche_entera", name: "Leche entera", cat: "lacteo", kcal: 62, p: 3.3, f: 3.5, c: 4.7 },
  { id: "leche_desc", name: "Leche descremada", cat: "lacteo", kcal: 35, p: 3.4, f: 0.1, c: 5 },
  { id: "yogur_entero", name: "Yogur entero natural", cat: "lacteo", kcal: 60, p: 3.5, f: 3.3, c: 4.7 },
  { id: "yogur_griego", name: "Yogur griego", cat: "lacteo", kcal: 100, p: 9, f: 5, c: 4 },
  { id: "yogur_desc", name: "Yogur descremado saborizado", cat: "lacteo", kcal: 50, p: 3.5, f: 0.5, c: 8 },
  { id: "queso_crema", name: "Queso crema", cat: "lacteo", kcal: 245, p: 6, f: 23, c: 4 },
  { id: "queso_port", name: "Queso port salut", cat: "lacteo", kcal: 290, p: 19, f: 22, c: 1 },
  { id: "queso_cremoso", name: "Queso cremoso", cat: "lacteo", kcal: 310, p: 20, f: 24, c: 1 },
  { id: "queso_rallado", name: "Queso rallado (sardo/reggianito)", cat: "lacteo", kcal: 420, p: 32, f: 30, c: 3 },
  { id: "muzzarella", name: "Muzzarella", cat: "lacteo", kcal: 280, p: 22, f: 22, c: 1 },
  { id: "ricota", name: "Ricota", cat: "lacteo", kcal: 175, p: 11, f: 13, c: 3 },
  { id: "manteca", name: "Manteca", cat: "lacteo", kcal: 720, p: 0.8, f: 81, c: 0.6 },
  { id: "huevo", name: "Huevo entero (1u ~55g)", cat: "lacteo", kcal: 155, p: 13, f: 11, c: 1.1, unit: "huevo", unitG: 55 },
  { id: "clara", name: "Clara de huevo", cat: "lacteo", kcal: 52, p: 11, f: 0.2, c: 0.7 },

  // Frutas
  { id: "banana", name: "Banana (1u ~120g)", cat: "fruta", kcal: 89, p: 1.1, f: 0.3, c: 23, unit: "unidad", unitG: 120 },
  { id: "manzana", name: "Manzana (1u ~180g)", cat: "fruta", kcal: 52, p: 0.3, f: 0.2, c: 14, unit: "unidad", unitG: 180 },
  { id: "naranja", name: "Naranja (1u ~150g)", cat: "fruta", kcal: 47, p: 0.9, f: 0.1, c: 12, unit: "unidad", unitG: 150 },
  { id: "mandarina", name: "Mandarina (1u ~90g)", cat: "fruta", kcal: 53, p: 0.8, f: 0.3, c: 13, unit: "unidad", unitG: 90 },
  { id: "pera", name: "Pera (1u ~170g)", cat: "fruta", kcal: 57, p: 0.4, f: 0.1, c: 15, unit: "unidad", unitG: 170 },
  { id: "kiwi", name: "Kiwi (1u ~70g)", cat: "fruta", kcal: 61, p: 1.1, f: 0.5, c: 15, unit: "unidad", unitG: 70 },
  { id: "uva", name: "Uvas", cat: "fruta", kcal: 67, p: 0.6, f: 0.4, c: 17 },
  { id: "frutilla", name: "Frutillas", cat: "fruta", kcal: 32, p: 0.7, f: 0.3, c: 7.7 },
  { id: "arandano", name: "Arándanos", cat: "fruta", kcal: 57, p: 0.7, f: 0.3, c: 14 },
  { id: "durazno", name: "Durazno (1u ~150g)", cat: "fruta", kcal: 39, p: 0.9, f: 0.3, c: 9.5, unit: "unidad", unitG: 150 },
  { id: "ciruela", name: "Ciruela", cat: "fruta", kcal: 46, p: 0.7, f: 0.3, c: 11 },
  { id: "sandia", name: "Sandía", cat: "fruta", kcal: 30, p: 0.6, f: 0.2, c: 7.5 },
  { id: "melon", name: "Melón", cat: "fruta", kcal: 34, p: 0.8, f: 0.2, c: 8 },
  { id: "ananas", name: "Ananá", cat: "fruta", kcal: 50, p: 0.5, f: 0.1, c: 13 },
  { id: "palta", name: "Palta", cat: "fruta", kcal: 160, p: 2, f: 15, c: 9 },
  { id: "limon", name: "Limón", cat: "fruta", kcal: 29, p: 1.1, f: 0.3, c: 9 },

  // Verduras
  { id: "tomate", name: "Tomate", cat: "verdura", kcal: 18, p: 0.9, f: 0.2, c: 3.9 },
  { id: "lechuga", name: "Lechuga", cat: "verdura", kcal: 15, p: 1.4, f: 0.2, c: 2.9 },
  { id: "pepino", name: "Pepino", cat: "verdura", kcal: 16, p: 0.7, f: 0.1, c: 3.6 },
  { id: "cebolla", name: "Cebolla", cat: "verdura", kcal: 40, p: 1.1, f: 0.1, c: 9.3 },
  { id: "morron", name: "Morrón / Pimiento", cat: "verdura", kcal: 30, p: 1, f: 0.3, c: 6 },
  { id: "zanahoria", name: "Zanahoria", cat: "verdura", kcal: 41, p: 0.9, f: 0.2, c: 9.6 },
  { id: "remolacha", name: "Remolacha hervida", cat: "verdura", kcal: 44, p: 1.7, f: 0.2, c: 10 },
  { id: "zapallo", name: "Zapallo / Calabaza", cat: "verdura", kcal: 26, p: 1, f: 0.1, c: 6.5 },
  { id: "zucchini", name: "Zucchini", cat: "verdura", kcal: 17, p: 1.2, f: 0.3, c: 3.1 },
  { id: "berenjena", name: "Berenjena", cat: "verdura", kcal: 25, p: 1, f: 0.2, c: 5.9 },
  { id: "espinaca", name: "Espinaca", cat: "verdura", kcal: 23, p: 2.9, f: 0.4, c: 3.6 },
  { id: "acelga", name: "Acelga", cat: "verdura", kcal: 19, p: 1.8, f: 0.2, c: 3.7 },
  { id: "brocoli", name: "Brócoli", cat: "verdura", kcal: 34, p: 2.8, f: 0.4, c: 7 },
  { id: "coliflor", name: "Coliflor", cat: "verdura", kcal: 25, p: 1.9, f: 0.3, c: 5 },
  { id: "champignon", name: "Champignones", cat: "verdura", kcal: 22, p: 3.1, f: 0.3, c: 3.3 },
  { id: "choclo", name: "Choclo / Maíz", cat: "verdura", kcal: 86, p: 3.3, f: 1.4, c: 19 },
  { id: "ajo", name: "Ajo", cat: "verdura", kcal: 149, p: 6.4, f: 0.5, c: 33 },

  // Legumbres
  { id: "lentejas", name: "Lentejas cocidas", cat: "legumbre", kcal: 116, p: 9, f: 0.4, c: 20 },
  { id: "garbanzos", name: "Garbanzos cocidos", cat: "legumbre", kcal: 165, p: 9, f: 2.6, c: 27 },
  { id: "porotos", name: "Porotos cocidos", cat: "legumbre", kcal: 130, p: 9, f: 0.5, c: 23 },
  { id: "arvejas", name: "Arvejas", cat: "legumbre", kcal: 81, p: 5.4, f: 0.4, c: 14 },

  // Frutos secos
  { id: "almendras", name: "Almendras", cat: "fruto_seco", kcal: 580, p: 21, f: 50, c: 22 },
  { id: "nueces", name: "Nueces", cat: "fruto_seco", kcal: 655, p: 15, f: 65, c: 14 },
  { id: "mani", name: "Maní", cat: "fruto_seco", kcal: 570, p: 26, f: 49, c: 16 },
  { id: "castanas", name: "Castañas de cajú", cat: "fruto_seco", kcal: 555, p: 18, f: 44, c: 30 },

  // Aceites y grasas
  { id: "aceite_oliva", name: "Aceite de oliva", cat: "grasa", kcal: 884, p: 0, f: 100, c: 0 },
  { id: "aceite_girasol", name: "Aceite girasol/maíz", cat: "grasa", kcal: 884, p: 0, f: 100, c: 0 },
  { id: "mayonesa", name: "Mayonesa", cat: "grasa", kcal: 680, p: 1, f: 75, c: 1 },
  { id: "mostaza", name: "Mostaza", cat: "grasa", kcal: 65, p: 4, f: 4, c: 5 },
  { id: "ketchup", name: "Ketchup", cat: "grasa", kcal: 100, p: 1, f: 0.2, c: 25 },

  // Comidas típicas
  { id: "empanada_carne", name: "Empanada de carne (1u ~80g)", cat: "comida", kcal: 250, p: 11, f: 13, c: 22, unit: "unidad", unitG: 80 },
  { id: "empanada_pollo", name: "Empanada de pollo (1u ~80g)", cat: "comida", kcal: 230, p: 13, f: 11, c: 21, unit: "unidad", unitG: 80 },
  { id: "empanada_jyq", name: "Empanada jamón y queso (1u ~80g)", cat: "comida", kcal: 260, p: 11, f: 14, c: 22, unit: "unidad", unitG: 80 },
  { id: "pizza", name: "Pizza muzzarella (porción ~150g)", cat: "comida", kcal: 270, p: 12, f: 10, c: 33, unit: "porción", unitG: 150 },
  { id: "milanga_napo", name: "Milanesa napolitana", cat: "comida", kcal: 320, p: 22, f: 18, c: 16 },
  { id: "tarta", name: "Tarta de verdura (porción ~150g)", cat: "comida", kcal: 210, p: 8, f: 12, c: 18, unit: "porción", unitG: 150 },
  { id: "hamburguesa", name: "Hamburguesa completa (1u ~250g)", cat: "comida", kcal: 280, p: 14, f: 16, c: 22, unit: "unidad", unitG: 250 },
  { id: "choripan", name: "Choripán (1u ~200g)", cat: "comida", kcal: 290, p: 13, f: 18, c: 20, unit: "unidad", unitG: 200 },
  { id: "lomito", name: "Lomito completo", cat: "comida", kcal: 270, p: 18, f: 13, c: 20 },
  { id: "sandwich_jyq", name: "Sándwich jamón y queso", cat: "comida", kcal: 280, p: 14, f: 12, c: 28 },
  { id: "ensalada_cesar", name: "Ensalada César", cat: "comida", kcal: 150, p: 8, f: 11, c: 5 },
  { id: "sushi_roll", name: "Sushi (1 pieza ~25g)", cat: "comida", kcal: 145, p: 4, f: 2, c: 28, unit: "pieza", unitG: 25 },

  // Snacks y dulces
  { id: "alfajor_simple", name: "Alfajor simple (1u ~50g)", cat: "snack", kcal: 420, p: 5, f: 18, c: 60, unit: "unidad", unitG: 50 },
  { id: "alfajor_triple", name: "Alfajor triple (1u ~70g)", cat: "snack", kcal: 450, p: 6, f: 22, c: 60, unit: "unidad", unitG: 70 },
  { id: "medialuna", name: "Medialuna (1u ~50g)", cat: "snack", kcal: 380, p: 7, f: 18, c: 47, unit: "unidad", unitG: 50 },
  { id: "factura", name: "Factura dulce (1u ~60g)", cat: "snack", kcal: 410, p: 7, f: 20, c: 50, unit: "unidad", unitG: 60 },
  { id: "galletitas_dulces", name: "Galletitas dulces", cat: "snack", kcal: 470, p: 6, f: 20, c: 68 },
  { id: "chocolate", name: "Chocolate con leche", cat: "snack", kcal: 535, p: 8, f: 30, c: 60 },
  { id: "dulce_leche", name: "Dulce de leche", cat: "snack", kcal: 315, p: 6, f: 7, c: 56 },
  { id: "mermelada", name: "Mermelada", cat: "snack", kcal: 250, p: 0.4, f: 0.1, c: 60 },
  { id: "azucar", name: "Azúcar", cat: "snack", kcal: 387, p: 0, f: 0, c: 100 },
  { id: "miel", name: "Miel", cat: "snack", kcal: 305, p: 0.3, f: 0, c: 82 },
  { id: "papas_fritas_paq", name: "Papas fritas paquete", cat: "snack", kcal: 540, p: 6, f: 35, c: 50 },
  { id: "palitos_salados", name: "Palitos salados", cat: "snack", kcal: 470, p: 10, f: 17, c: 65 },
  { id: "helado", name: "Helado (porción ~80g)", cat: "snack", kcal: 200, p: 3.5, f: 11, c: 22, unit: "porción", unitG: 80 },

  // Bebidas
  { id: "agua", name: "Agua", cat: "bebida", kcal: 0, p: 0, f: 0, c: 0 },
  { id: "mate_cocido", name: "Mate cocido sin azúcar", cat: "bebida", kcal: 2, p: 0, f: 0, c: 0.5 },
  { id: "cafe", name: "Café solo", cat: "bebida", kcal: 2, p: 0.1, f: 0, c: 0 },
  { id: "te", name: "Té", cat: "bebida", kcal: 1, p: 0, f: 0, c: 0 },
  { id: "gaseosa", name: "Gaseosa cola", cat: "bebida", kcal: 42, p: 0, f: 0, c: 10.6 },
  { id: "gaseosa_light", name: "Gaseosa light", cat: "bebida", kcal: 1, p: 0, f: 0, c: 0 },
  { id: "jugo_naranja", name: "Jugo de naranja", cat: "bebida", kcal: 45, p: 0.7, f: 0.2, c: 10 },
  { id: "cerveza", name: "Cerveza", cat: "bebida", kcal: 43, p: 0.5, f: 0, c: 3.6 },
  { id: "vino_tinto", name: "Vino tinto", cat: "bebida", kcal: 85, p: 0.1, f: 0, c: 2.6 },
  { id: "fernet", name: "Fernet (copa ~50ml)", cat: "bebida", kcal: 100, p: 0, f: 0, c: 8 },

  // Suplementos
  { id: "whey", name: "Whey protein (1 scoop ~30g)", cat: "supl", kcal: 400, p: 80, f: 4, c: 7, unit: "scoop", unitG: 30 },
  { id: "creatina", name: "Creatina (5g)", cat: "supl", kcal: 0, p: 0, f: 0, c: 0, unit: "dosis", unitG: 5 },
];

const FOOD_CATS = {
  carne:      { label: "Carnes", color: "#f87171" },
  almidon:    { label: "Almidones", color: "#fbbf24" },
  lacteo:     { label: "Lácteos · Huevo", color: "#a78bfa" },
  fruta:      { label: "Frutas", color: "#34d399" },
  verdura:    { label: "Verduras", color: "#86efac" },
  legumbre:   { label: "Legumbres", color: "#fb923c" },
  fruto_seco: { label: "Frutos secos", color: "#d97706" },
  grasa:      { label: "Aceites · Grasas", color: "#facc15" },
  comida:     { label: "Comidas", color: "#f472b6" },
  snack:      { label: "Snacks · Dulces", color: "#e879f9" },
  bebida:     { label: "Bebidas", color: "#60a5fa" },
  supl:       { label: "Suplementos", color: "#2dd4bf" },
};

const DEFAULT_NUTRI_GOALS = { kcal: 2050, p: 160, f: 60, c: 200 };

/* ----------------------------- SEEDS ----------------------------- */
const SEED_TASKS = [
  { id: 1, title: "Deep Work GenMove",     time: "08:00", day: todayIdx,        cat: "negocios",   done: false },
  { id: 2, title: "Gym",                   time: "10:00", day: todayIdx,        cat: "fisico",     done: false },
  { id: 3, title: "Estudio IA / prompting",time: "12:00", day: todayIdx,        cat: "estudio",    done: false },
  { id: 4, title: "Seguimiento clientes",  time: "16:00", day: todayIdx,        cat: "negocios",   done: false },
  { id: 5, title: "Lectura 30 min",        time: "21:00", day: todayIdx,        cat: "disciplina", done: false },
];
const SEED_HABITS = [
  { id: 1, name: "Despertar",   iconKey: "wind",  time: "06:30", streak: 0, week: [0,0,0,0,0,0,0] },
  { id: 2, name: "3L de agua",  iconKey: "water", time: "",      streak: 0, week: [0,0,0,0,0,0,0] },
  { id: 3, name: "Gym",         iconKey: "gym",   time: "10:00", streak: 0, week: [0,0,0,0,0,0,0] },
  { id: 4, name: "Leer 30 min", iconKey: "book",  time: "21:00", streak: 0, week: [0,0,0,0,0,0,0] },
  { id: 5, name: "Sin redes",   iconKey: "phone", time: "",      streak: 0, week: [0,0,0,0,0,0,0] },
];
const SEED_FOCUS = [0, 0, 0, 0, 0, 0, 0];

const load = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
};

/* ---------- SW + notifs ---------- */
const registerSW = async () => {
  if (!("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.register("/service-worker.js"); }
  catch (e) { console.warn(e); return null; }
};
const askNotifPerm = async () => {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied")  return "denied";
  return await Notification.requestPermission();
};
const showNotif = async (title, body) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) reg.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", vibrate: [200, 100, 200] });
    else new Notification(title, { body, icon: "/icon-192.png" });
  } catch (e) { console.warn(e); }
};

/* ============================== ROOT ============================== */
export default function TempleOS() {
  const [tab, setTab] = useState("inicio");
  const [tasks, setTasks]   = useState(() => load("temple_tasks_v3", SEED_TASKS));
  const [habits, setHabits] = useState(() => load("temple_habits_v4", SEED_HABITS));
  const [focus, setFocus]   = useState(() => load("temple_focus_v2", SEED_FOCUS));
  const [notif, setNotif]   = useState(() => load("temple_notif", { enabled: false, status: "default" }));
  const [gymLog, setGymLog] = useState(() => load("temple_gym_v1", {})); // { 'YYYY-MM-DD_dayId': { ticks: {exId: n} } }
  const [routine, setRoutine] = useState(() => load("temple_gym_routine_v1", SEED_GYM));
  const [nutriLog, setNutriLog] = useState(() => load("temple_nutri_v1", {})); // { 'YYYY-MM-DD': [{id, qty, isUnit}] }
  const [nutriGoals, setNutriGoals] = useState(() => load("temple_nutri_goals", DEFAULT_NUTRI_GOALS));

  useEffect(() => { localStorage.setItem("temple_tasks_v3", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("temple_habits_v4", JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem("temple_focus_v2", JSON.stringify(focus)); }, [focus]);
  useEffect(() => { localStorage.setItem("temple_notif", JSON.stringify(notif)); }, [notif]);
  useEffect(() => { localStorage.setItem("temple_gym_v1", JSON.stringify(gymLog)); }, [gymLog]);
  useEffect(() => { localStorage.setItem("temple_gym_routine_v1", JSON.stringify(routine)); }, [routine]);
  useEffect(() => { localStorage.setItem("temple_nutri_v1", JSON.stringify(nutriLog)); }, [nutriLog]);
  useEffect(() => { localStorage.setItem("temple_nutri_goals", JSON.stringify(nutriGoals)); }, [nutriGoals]);

  useEffect(() => { registerSW(); }, []);

  useEffect(() => {
    if (!notif.enabled) return;
    const tick = () => {
      const now = new Date();
      const hhmm = String(now.getHours()).padStart(2,"0") + ":" + String(now.getMinutes()).padStart(2,"0");
      tasks.forEach(t => {
        if (t.day === todayIdx && !t.done && t.time === hhmm) {
          const key = `notified_${t.id}_${now.toDateString()}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            showNotif("Toca: " + t.title, `${t.time} · ${CATS[t.cat]?.label || ""}`);
          }
        }
      });
      habits.forEach(h => {
        if (h.time === hhmm && !h.week[todayIdx]) {
          const key = `notified_hab_${h.id}_${now.toDateString()}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            showNotif("Hábito: " + h.name, `${h.time} · no olvides marcarlo`);
          }
        }
      });
    };
    tick();
    const iv = setInterval(tick, 30000);
    return () => clearInterval(iv);
  }, [notif.enabled, tasks, habits]);

  const todayTasks = tasks.filter(t => t.day === todayIdx);
  const doneToday = todayTasks.filter(t => t.done).length;
  const pctToday = todayTasks.length ? Math.round((doneToday / todayTasks.length) * 100) : 0;

  const goals = useMemo(() => {
    const byCat = (c) => {
      const arr = tasks.filter(t => t.cat === c);
      return arr.length ? Math.round((arr.filter(t => t.done).length / arr.length) * 100) : 0;
    };
    const habitsToday = habits.filter(h => h.week[todayIdx]).length;
    const disc = Math.round(0.5 * byCat("disciplina") + 0.5 * (habits.length ? habitsToday / habits.length * 100 : 0));
    return { fisico: byCat("fisico"), negocios: byCat("negocios"), estudio: byCat("estudio"), disciplina: disc };
  }, [tasks, habits]);

  const focusToday = focus[todayIdx];
  const totalStreak = habits.length ? Math.max(...habits.map(h => h.streak)) : 0;

  const toggleTask = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const delTask = (id) => setTasks(p => p.filter(t => t.id !== id));
  const editTask = (id, title) => setTasks(p => p.map(t => t.id === id ? { ...t, title } : t));
  const addTask = (t, repeatId) => {
    const opt = REPEAT_OPTS.find(o => o.id === repeatId) || REPEAT_OPTS[0];
    setTasks(p => {
      if (!opt.days) return [...p, { ...t, id: Date.now(), done: false }];
      const nuevas = opt.days.map((d, i) => ({ ...t, id: Date.now() + i, day: d, done: false }));
      return [...p, ...nuevas];
    });
  };
  const toggleHabit = (id) => setHabits(p => p.map(h => {
    if (h.id !== id) return h;
    const w = [...h.week]; const was = w[todayIdx]; w[todayIdx] = was ? 0 : 1;
    return { ...h, week: w, streak: Math.max(0, h.streak + (was ? -1 : 1)) };
  }));
  const addHabit = (name, time = "") => setHabits(p => [...p, { id: Date.now(), name, iconKey: "leaf", time, streak: 0, week: [0,0,0,0,0,0,0] }]);
  const editHabit = (id, patch) => setHabits(p => p.map(h => h.id === id ? { ...h, ...patch } : h));
  const delHabit = (id) => setHabits(p => p.filter(h => h.id !== id));
  const addFocus = (min) => setFocus(p => p.map((v, i) => i === todayIdx ? v + min : v));

  const toggleNotif = async () => {
    if (notif.enabled) { setNotif({ enabled: false, status: notif.status }); return; }
    const r = await askNotifPerm();
    if (r === "granted") {
      setNotif({ enabled: true, status: "granted" });
      showNotif("Notificaciones activadas", "Te aviso cuando tengas tareas o termine un timer.");
    } else {
      setNotif({ enabled: false, status: r });
      alert(r === "denied"
        ? "Las notificaciones están bloqueadas. Habilitalas desde la configuración del navegador."
        : "Tu dispositivo no soporta notificaciones web.");
    }
  };

  const NAV = [
    { id: "inicio",  label: "Inicio",     Icon: Home },
    { id: "tareas",  label: "Tareas",     Icon: ListChecks },
    { id: "agenda",  label: "Calendario", Icon: CalendarDays },
    { id: "habitos", label: "Hábitos",    Icon: Flame },
    { id: "gym",     label: "Gym",        Icon: Dumbbell },
    { id: "nutri",   label: "Nutrición",  Icon: Apple },
    { id: "stats",   label: "Stats",      Icon: BarChart3 },
    { id: "enfoque", label: "Enfoque",    Icon: Timer },
  ];

  const shared = { tasks, habits, focus, goals, todayTasks, doneToday, pctToday,
    focusToday, totalStreak, notif, toggleNotif,
    toggleTask, delTask, addTask, editTask, toggleHabit, addHabit, editHabit, delHabit, addFocus, setTab,
    gymLog, setGymLog, routine, setRoutine, nutriLog, setNutriLog, nutriGoals, setNutriGoals };

  return (
    <div className="tos">
      <Style />
      <div className="bg-glow a" />
      <div className="bg-glow b" />

      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="logo">☯</div>
            <div>
              <p className="eyebrow">Temple OS</p>
              <h1 className="brand-name">Modo Monje</h1>
            </div>
          </div>
          <div className="searchwrap">
            <Search size={17} className="dim" />
            <input placeholder="Buscar enfoque, tareas o ideas…" />
          </div>
          <div className="topright">
            <div className="streak-pill"><Flame size={15} /> {totalStreak}</div>
            <button type="button" className="iconbtn" onClick={toggleNotif} title={notif.enabled ? "Notif ON" : "Notif OFF"}>
              {notif.enabled ? <BellRing size={18} color="#34d399" /> : <BellOff size={18} />}
            </button>
            <div className="avatar">M</div>
          </div>
        </header>

        <div className="body">
          <nav className="sidebar">
            {NAV.map(({ id, label, Icon }) => (
              <button key={id} type="button" className={`navbtn ${tab === id ? "on" : ""}`} onClick={() => setTab(id)} title={label}>
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <main className="content" key={tab}>
            {tab === "inicio"  && <Inicio  {...shared} />}
            {tab === "tareas"  && <Tareas  {...shared} />}
            {tab === "agenda"  && <Agenda  {...shared} />}
            {tab === "habitos" && <Habitos {...shared} />}
            {tab === "gym"     && <Gym     {...shared} />}
            {tab === "nutri"   && <Nutri   {...shared} />}
            {tab === "stats"   && <Stats   {...shared} />}
            {tab === "enfoque" && <Enfoque {...shared} />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ============================== INICIO ============================== */
function Inicio({ todayTasks, doneToday, pctToday, goals, focusToday, totalStreak, habits, toggleTask, setTab, notif, toggleNotif }) {
  const habitsToday = habits.filter(h => h.week[todayIdx]).length;
  const resumen = [
    { ok: true,  txt: `${doneToday} de ${todayTasks.length} tareas hoy.` },
    { ok: true,  txt: `${habitsToday}/${habits.length} hábitos sostenidos.` },
    { ok: focusToday > 0, txt: `${focusToday} min de enfoque profundo.` },
    { ok: pctToday >= 60, txt: pctToday >= 60 ? "Buen ritmo, seguí." : "Falta cierre del día." },
  ];
  return (
    <div className="stack">
      <div className="pagehead">
        <div>
          <p className="eyebrow">Bienvenido de vuelta</p>
          <h2 className="h2">Maverick · {monthDay}</h2>
        </div>
        <div className="day-ring">
          <Ring pct={pctToday} size={70} />
          <div><p className="big">{pctToday}%</p><p className="dim sm">del día</p></div>
        </div>
      </div>

      {!notif.enabled && notif.status !== "denied" && (
        <Card glass>
          <div className="cta-row">
            <div>
              <p className="eyebrow">Recordatorios</p>
              <h3 className="h3">Activá las notificaciones</h3>
              <p className="dim" style={{marginTop:6,fontSize:13}}>Aviso de tareas a horario y fin del timer.</p>
            </div>
            <button type="button" className="primary" onClick={toggleNotif}><BellRing size={18} /> Activar</button>
          </div>
        </Card>
      )}

      <Card title="Agenda de hoy" right={<button type="button" className="ghostbtn" onClick={() => setTab("agenda")}>Ver semana</button>}>
        <div className="task-grid">
          {todayTasks.length === 0 && <p className="dim">Sin tareas para hoy.</p>}
          {todayTasks.map(t => {
            const c = CATS[t.cat];
            return (
              <button key={t.id} type="button" className={`task-card ${t.done ? "done" : ""}`} onClick={() => toggleTask(t.id)} style={{ "--c": c.color }}>
                <div className="tc-top">
                  <span className="tc-time">{t.time}</span>
                  <c.Icon size={16} style={{ color: c.color }} />
                </div>
                <h4>{t.title}</h4>
                <div className="check">{t.done && <Check size={14} />}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="two-col">
        <Card title="Objetivos">
          <div className="goals">
            {Object.entries(goals).map(([k, v]) => (
              <div key={k} className="goalrow">
                <div className="goalhead"><span>{CATS[k].label}</span><span>{v}%</span></div>
                <Bar pct={v} color={CATS[k].color} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Resumen del día" accent>
          <div className="resumen">
            {resumen.map((r, i) => <p key={i} className={r.ok ? "" : "warn"}>{r.ok ? "✔" : "⚠"} {r.txt}</p>)}
          </div>
          <div className="mini-stats">
            <div><p className="big">{totalStreak}</p><p className="dim sm">racha máx</p></div>
            <div><p className="big">{focusToday}′</p><p className="dim sm">enfoque hoy</p></div>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card glass>
          <div className="cta-row">
            <div>
              <p className="eyebrow">Cuerpo</p>
              <h3 className="h3">Hora de entrenar</h3>
              <p className="dim sm" style={{marginTop:6}}>Cargá tu sesión y tildá cada serie.</p>
            </div>
            <button type="button" className="primary" onClick={() => setTab("gym")}><Dumbbell size={18}/> Gym</button>
          </div>
        </Card>
        <Card glass>
          <div className="cta-row">
            <div>
              <p className="eyebrow">Macros</p>
              <h3 className="h3">¿Qué comiste hoy?</h3>
              <p className="dim sm" style={{marginTop:6}}>Sumá tus calorías y proteína del día.</p>
            </div>
            <button type="button" className="primary" onClick={() => setTab("nutri")}><Apple size={18}/> Nutrición</button>
          </div>
        </Card>
      </div>

      <Card glass>
        <div className="cta-row">
          <div>
            <p className="eyebrow">Estado mental</p>
            <h3 className="h3">Calma + Enfoque</h3>
            <div className="chips">{["Disciplina","Estrategia","Consistencia"].map(c => <span key={c} className="chip">{c}</span>)}</div>
          </div>
          <button type="button" className="primary" onClick={() => setTab("enfoque")}><Zap size={18}/> Entrar en Modo Enfoque</button>
        </div>
      </Card>
    </div>
  );
}

/* ============================== TAREAS ============================== */
function Tareas({ tasks, toggleTask, delTask, addTask, editTask }) {
  const [filter, setFilter] = useState("todas");
  const [form, setForm] = useState({ title:"", time:"08:00", day:todayIdx, cat:"negocios", repeat:"once" });
  const list = tasks.filter(t => filter === "todas" ? true : t.cat === filter);

  const submit = () => {
    if (!form.title.trim()) return;
    const { repeat, ...t } = form;
    addTask(t, repeat);
    setForm({ ...form, title: "" });
  };

  return (
    <div className="stack">
      <div className="pagehead"><h2 className="h2">Tareas</h2>
        <span className="dim">{tasks.filter(t => t.done).length}/{tasks.length} hechas</span>
      </div>
      <Card title="Cargar tarea">
        <div className="addbar">
          <input className="inp grow" placeholder="¿Qué hay que hacer?" value={form.title}
            onChange={e => setForm({...form, title:e.target.value})}
            onKeyDown={e => e.key === "Enter" && submit()} />
          <input className="inp" type="time" value={form.time} onChange={e => setForm({...form, time:e.target.value})} />
          <select className="inp" value={form.day} onChange={e => setForm({...form, day:+e.target.value})} disabled={form.repeat !== "once"}>
            {DAYS.map((d,i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <select className="inp" value={form.cat} onChange={e => setForm({...form, cat:e.target.value})}>
            {Object.entries(CATS).map(([k,c]) => <option key={k} value={k}>{c.label}</option>)}
          </select>
          <select className="inp" value={form.repeat} onChange={e => setForm({...form, repeat:e.target.value})}>
            {REPEAT_OPTS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button type="button" className="primary sm" onClick={submit}><Plus size={16}/> Agregar</button>
        </div>
        {form.repeat !== "once" && (
          <p className="dim sm" style={{marginTop:10,display:"flex",alignItems:"center",gap:6}}>
            <Repeat size={12}/> Se crea una tarea por cada día seleccionado.
          </p>
        )}
      </Card>

      <div className="filters">
        <button type="button" className={`fchip ${filter === "todas" ? "on" : ""}`} onClick={() => setFilter("todas")}>Todas</button>
        {Object.entries(CATS).map(([k,c]) => (
          <button key={k} type="button" className={`fchip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)} style={{"--c":c.color}}>{c.label}</button>
        ))}
      </div>

      <Card>
        <div className="tasklist">
          {list.length === 0 && <p className="dim">No hay tareas en este filtro.</p>}
          {list.slice().sort((a,b) => a.day - b.day || a.time.localeCompare(b.time)).map(t => {
            const c = CATS[t.cat];
            return (
              <div key={t.id} className={`taskrow ${t.done ? "done" : ""}`} style={{"--c":c.color}}>
                <button type="button" className="rowedit" onClick={() => {
                  const nuevo = prompt("Editar tarea", t.title);
                  if (nuevo && nuevo.trim()) editTask(t.id, nuevo.trim());
                }}><Pencil size={14}/></button>
                <button type="button" className="rowcheck" onClick={() => toggleTask(t.id)}>{t.done && <Check size={14}/>}</button>
                <div className="rowmain">
                  <span className="rowtitle">{t.title}</span>
                  <span className="rowmeta"><c.Icon size={12} style={{color:c.color}}/> {c.label} · {DAYS[t.day]} {t.time}</span>
                </div>
                <button type="button" className="rowdel" onClick={() => delTask(t.id)}><Trash2 size={15}/></button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============================== AGENDA ============================== */
function Agenda({ tasks, toggleTask }) {
  const [weekOff, setWeekOff] = useState(0);
  const [dayView, setDayView] = useState(todayIdx);
  const HOURS = ["07:00","08:00","09:00","10:00","12:00","16:00","18:00","21:00"];
  return (
    <div className="stack">
      <div className="pagehead">
        <h2 className="h2">Calendario</h2>
        <div className="weeknav">
          <button type="button" className="iconbtn" onClick={() => setWeekOff(w => w-1)}><ChevronLeft size={18}/></button>
          <span>{weekOff === 0 ? "Esta semana" : weekOff > 0 ? `+${weekOff} sem` : `${weekOff} sem`}</span>
          <button type="button" className="iconbtn" onClick={() => setWeekOff(w => w+1)}><ChevronRight size={18}/></button>
        </div>
      </div>
      <div className="cal-mobile">
        <Card>
          <div className="cal-day-nav">
            <button type="button" className="iconbtn" onClick={() => setDayView(d => (d+6)%7)}><ChevronLeft size={16}/></button>
            <div className="cal-day-title">
              <p className="eyebrow">{DAYS[dayView]}</p>
              <h3 className="h3">{dayView === todayIdx ? "Hoy" : DAYS[dayView]}</h3>
            </div>
            <button type="button" className="iconbtn" onClick={() => setDayView(d => (d+1)%7)}><ChevronRight size={16}/></button>
          </div>
          <div className="cal-day-list">
            {tasks.filter(t => t.day === dayView).length === 0 && <p className="dim">Sin tareas este día.</p>}
            {tasks.filter(t => t.day === dayView).sort((a,b) => a.time.localeCompare(b.time)).map(t => {
              const c = CATS[t.cat];
              return (
                <button key={t.id} type="button" className={`cal-day-row ${t.done ? "done" : ""}`} style={{"--c":c.color}} onClick={() => toggleTask(t.id)}>
                  <span className="cdr-time">{t.time}</span>
                  <span className="cdr-title">{t.title}</span>
                  <c.Icon size={14} style={{color:c.color}}/>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
      <div className="cal-desktop">
        <Card>
          <div className="cal">
            <div className="cal-head">
              <div className="cal-corner"/>
              {DAYS.map((d,i) => <div key={i} className={`cal-day ${i === todayIdx && weekOff === 0 ? "today" : ""}`}>{d}</div>)}
            </div>
            <div className="cal-body">
              {HOURS.map(h => (
                <div key={h} className="cal-row">
                  <div className="cal-time">{h}</div>
                  {DAYS.map((_,di) => {
                    const cell = tasks.filter(t => t.day === di && t.time === h);
                    return (
                      <div key={di} className="cal-cell">
                        {cell.map(t => {
                          const c = CATS[t.cat];
                          return <button key={t.id} type="button" className={`cal-ev ${t.done ? "done" : ""}`} style={{"--c":c.color}} onClick={() => toggleTask(t.id)}>{t.title}</button>;
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== HÁBITOS ============================== */
function Habitos({ habits, toggleHabit, addHabit, editHabit, delHabit }) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const consistency = habits.length
    ? Math.round(habits.reduce((s,h) => s + h.week.filter(Boolean).length, 0) / (habits.length*7) * 100)
    : 0;
  const crear = () => { if (name.trim()) { addHabit(name.trim(), time); setName(""); setTime(""); } };

  /* orden: primero los que tienen hora (cronológico), después los sin hora */
  const ordered = [...habits].sort((a, b) => {
    const ta = a.time || "", tb = b.time || "";
    if (ta && tb) return ta.localeCompare(tb);
    if (ta && !tb) return -1;
    if (!ta && tb) return 1;
    return 0;
  });

  return (
    <div className="stack">
      <div className="pagehead"><h2 className="h2">Hábitos</h2>
        <div className="day-ring"><Ring pct={consistency} size={54}/><div><p className="big">{consistency}%</p><p className="dim sm">consistencia</p></div></div>
      </div>
      <Card title="Nuevo hábito">
        <div className="addbar">
          <input className="inp grow" placeholder="Ej: Despertar, meditar, journaling…" value={name}
            onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && crear()}/>
          <input className="inp" type="time" value={time} onChange={e => setTime(e.target.value)} title="Hora (opcional)"/>
          <button type="button" className="primary sm" onClick={crear}><Plus size={16}/> Crear</button>
        </div>
        <p className="dim sm" style={{marginTop:10}}>La hora es opcional. Con hora se ordenan tu día; sin hora quedan al final como hábitos sueltos.</p>
      </Card>
      <Card>
        <div className="hablist">
          {ordered.length === 0 && <p className="dim">No hay hábitos.</p>}
          {ordered.map(h => {
            const HIcon = habitIcon(h.iconKey);
            return (
              <div key={h.id} className="habrow">
                <div className="hableft">
                  <div className="habtime-col">
                    {h.time
                      ? <span className="habtime">{h.time}</span>
                      : <span className="habtime none">—</span>}
                  </div>
                  <div className="habicon"><HIcon size={18}/></div>
                  <div className="habnamewrap">
                    <p className="habname">{h.name}</p>
                    <p className="dim sm"><Flame size={11}/> {h.streak} días</p>
                  </div>
                </div>
                <div className="habweek">
                  {h.week.map((d,i) => <span key={i} className={`dot ${d ? "fill" : ""} ${i === todayIdx ? "today" : ""}`}>{DAYS[i][0]}</span>)}
                </div>
                <button type="button" className="rowedit" title="Editar hora" onClick={() => {
                  const nueva = prompt(`Hora para "${h.name}" (formato HH:MM, vacío = sin hora)`, h.time || "");
                  if (nueva === null) return;
                  const v = nueva.trim();
                  if (v === "" || /^([01]?\d|2[0-3]):[0-5]\d$/.test(v)) editHabit(h.id, { time: v });
                  else alert("Hora inválida. Usá formato HH:MM, por ejemplo 06:30.");
                }}><Pencil size={14}/></button>
                <button type="button" className={`habtoggle ${h.week[todayIdx] ? "on" : ""}`} onClick={() => toggleHabit(h.id)}>
                  {h.week[todayIdx] ? <Check size={16}/> : <Plus size={16}/>}
                </button>
                <button type="button" className="rowdel" onClick={() => { if (confirm(`¿Eliminar "${h.name}"?`)) delHabit(h.id); }}><Trash2 size={15}/></button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============================== GYM (editable) ============================== */
const newEx = () => ({ id: `e${Date.now()}_${Math.floor(Math.random()*9999)}`, n: "Ejercicio nuevo", sets: 3, reps: "10" });
const newDay = () => ({ id: `d${Date.now()}`, name: "Día nuevo", focus: "", weekday: null, rest: false, exs: [newEx()] });

function Gym({ gymLog, setGymLog, routine, setRoutine }) {
  const [editMode, setEditMode] = useState(false);
  // día activo: el primero que coincide con hoy, o el primero de la lista
  const [activeId, setActiveId] = useState(() => {
    const match = routine.find(d => d.weekday === todayIdx);
    return match ? match.id : (routine[0]?.id || null);
  });
  const today = todayKey();
  const day = routine.find(d => d.id === activeId) || routine[0];

  if (!day) {
    return (
      <div className="stack">
        <div className="pagehead"><h2 className="h2">Gym</h2></div>
        <Card>
          <div className="rest-day">
            <Dumbbell size={36} color="#34d399"/>
            <h3 className="h3" style={{marginTop:14}}>No hay días en tu rutina</h3>
            <button type="button" className="primary" style={{marginTop:18}} onClick={() => { const d = newDay(); setRoutine([d]); setActiveId(d.id); setEditMode(true); }}>
              <Plus size={18}/> Crear primer día
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const sessionKey = `${today}_${day.id}`;
  const session = gymLog[sessionKey] || { ticks: {} };
  const totalSets = day.rest ? 0 : day.exs.reduce((s,e) => s + (Number(e.sets)||0), 0);
  const doneSets = Object.values(session.ticks || {}).reduce((s,v) => s+v, 0);
  const pct = totalSets ? Math.round(doneSets/totalSets*100) : 0;

  /* tildar serie por exId */
  const tickSet = (exId, setIdx, exSets) => {
    setGymLog(prev => {
      const cur = prev[sessionKey] || { ticks: {} };
      const exTicks = cur.ticks[exId] || 0;
      const target = setIdx + 1 <= exTicks ? setIdx : setIdx + 1;
      return { ...prev, [sessionKey]: { ...cur, ticks: { ...cur.ticks, [exId]: target } } };
    });
  };
  const resetDay = () => {
    if (!confirm("¿Borrar el progreso de hoy de este día?")) return;
    setGymLog(prev => { const c = { ...prev }; delete c[sessionKey]; return c; });
  };

  /* ---- edición de rutina ---- */
  const updDay = (patch) => setRoutine(r => r.map(d => d.id === day.id ? { ...d, ...patch } : d));
  const updEx = (exId, patch) => setRoutine(r => r.map(d => d.id === day.id ? { ...d, exs: d.exs.map(e => e.id === exId ? { ...e, ...patch } : e) } : d));
  const addExercise = () => setRoutine(r => r.map(d => d.id === day.id ? { ...d, exs: [...d.exs, newEx()] } : d));
  const delExercise = (exId) => setRoutine(r => r.map(d => d.id === day.id ? { ...d, exs: d.exs.filter(e => e.id !== exId) } : d));
  const moveEx = (exId, dir) => setRoutine(r => r.map(d => {
    if (d.id !== day.id) return d;
    const i = d.exs.findIndex(e => e.id === exId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= d.exs.length) return d;
    const exs = [...d.exs]; [exs[i], exs[j]] = [exs[j], exs[i]];
    return { ...d, exs };
  }));
  const addRoutineDay = () => { const d = newDay(); setRoutine(r => [...r, d]); setActiveId(d.id); };
  const delRoutineDay = () => {
    if (!confirm(`¿Eliminar el día "${day.name}"? Se borra de tu rutina.`)) return;
    setRoutine(r => {
      const filtered = r.filter(d => d.id !== day.id);
      setActiveId(filtered[0]?.id || null);
      return filtered;
    });
  };

  /* días entrenados esta semana */
  const weekTrained = useMemo(() => {
    const days = {};
    routine.forEach(d => {
      const now = new Date();
      // buscar si hubo sesión con ticks en los últimos 7 días para este día
      for (let i = 0; i < 7; i++) {
        const dd = new Date(now); dd.setDate(now.getDate() - i);
        const k = `${dd.toISOString().slice(0,10)}_${d.id}`;
        if (gymLog[k] && gymLog[k].ticks && Object.values(gymLog[k].ticks).some(v => v > 0)) { days[d.id] = true; break; }
      }
    });
    return days;
  }, [gymLog, routine]);

  return (
    <div className="stack">
      <div className="pagehead">
        <div>
          <h2 className="h2">Gym</h2>
          <p className="dim sm">{routine.filter(d => !d.rest).length} días de entreno · {editMode ? "modo edición" : "modo entrenar"}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {!editMode && !day.rest && (
            <div className="day-ring">
              <Ring pct={pct} size={48}/>
              <div><p className="big">{doneSets}/{totalSets}</p><p className="dim sm">series</p></div>
            </div>
          )}
          <button type="button" className={`iconbtn ${editMode ? "edit-on" : ""}`} onClick={() => setEditMode(m => !m)} title={editMode ? "Terminar edición" : "Editar rutina"}>
            {editMode ? <Check size={18}/> : <Pencil size={18}/>}
          </button>
        </div>
      </div>

      {/* selector de días */}
      <Card>
        <div className="gym-week">
          {routine.map(d => (
            <button key={d.id} type="button" className={`gym-day-pill ${activeId === d.id ? "on" : ""} ${d.rest ? "rest" : ""} ${weekTrained[d.id] ? "trained" : ""}`} onClick={() => setActiveId(d.id)}>
              <span className="gdp-day">{d.weekday !== null ? DAYS[d.weekday] : "—"}</span>
              <span className="gdp-name">{d.name}</span>
              {weekTrained[d.id] && <Check size={11} className="gdp-check"/>}
            </button>
          ))}
          {editMode && (
            <button type="button" className="gym-day-pill add" onClick={addRoutineDay}>
              <Plus size={18}/>
              <span className="gdp-name">Nuevo día</span>
            </button>
          )}
        </div>
      </Card>

      {/* ====== MODO EDICIÓN ====== */}
      {editMode ? (
        <Card>
          <div className="edit-day-head">
            <label className="edit-field">
              <span>Nombre del día</span>
              <input className="inp" value={day.name} onChange={e => updDay({ name: e.target.value })}/>
            </label>
            <label className="edit-field">
              <span>Foco / músculos</span>
              <input className="inp" value={day.focus} onChange={e => updDay({ focus: e.target.value })} placeholder="Ej: Pecho · Hombro"/>
            </label>
            <label className="edit-field">
              <span>Día de la semana</span>
              <select className="inp" value={day.weekday === null ? "" : day.weekday} onChange={e => updDay({ weekday: e.target.value === "" ? null : +e.target.value })}>
                <option value="">Suelto</option>
                {DAYS.map((d,i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </label>
            <label className="edit-field rest-toggle">
              <span>¿Es descanso?</span>
              <button type="button" className={`toggle ${day.rest ? "on" : ""}`} onClick={() => updDay({ rest: !day.rest })}>
                {day.rest ? "Sí, descanso" : "No, entreno"}
              </button>
            </label>
          </div>

          {!day.rest && (
            <>
              <div className="exedit-list">
                {day.exs.map((ex, i) => (
                  <div key={ex.id} className="exedit">
                    <div className="exedit-order">
                      <button type="button" onClick={() => moveEx(ex.id, -1)} disabled={i === 0}><ChevronLeft size={14} style={{transform:"rotate(90deg)"}}/></button>
                      <button type="button" onClick={() => moveEx(ex.id, 1)} disabled={i === day.exs.length-1}><ChevronRight size={14} style={{transform:"rotate(90deg)"}}/></button>
                    </div>
                    <input className="inp exedit-name" value={ex.n} onChange={e => updEx(ex.id, { n: e.target.value })} placeholder="Nombre del ejercicio"/>
                    <input className="inp exedit-num" type="number" min="1" value={ex.sets} onChange={e => updEx(ex.id, { sets: Math.max(1, +e.target.value || 1) })} title="Series"/>
                    <span className="exedit-x">×</span>
                    <input className="inp exedit-reps" value={ex.reps} onChange={e => updEx(ex.id, { reps: e.target.value })} placeholder="reps" title="Reps"/>
                    <button type="button" className="rowdel" onClick={() => delExercise(ex.id)}><Trash2 size={15}/></button>
                  </div>
                ))}
              </div>
              <button type="button" className="ghostbtn" style={{marginTop:14}} onClick={addExercise}><Plus size={14}/> Agregar ejercicio</button>
            </>
          )}

          <div className="edit-day-footer">
            <button type="button" className="rowdel-btn" onClick={delRoutineDay}><Trash2 size={15}/> Eliminar este día</button>
          </div>
        </Card>
      ) : (
        /* ====== MODO ENTRENAR ====== */
        day.rest ? (
          <Card>
            <div className="rest-day">
              <Leaf size={36} color="#34d399"/>
              <h3 className="h3" style={{marginTop:14}}>{day.name}</h3>
              <p className="dim center" style={{maxWidth:380,marginTop:10}}>
                {day.focus || "Caminata · movilidad · agua · sueño."}<br/>
                El músculo se construye descansando, no entrenando.
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="cardhead">
              <div>
                <h3 className="cardtitle">{day.name}</h3>
                <p className="dim sm">{day.focus}</p>
              </div>
              {doneSets > 0 && <button type="button" className="ghostbtn" onClick={resetDay}><RotateCcw size={14}/> Reiniciar</button>}
            </div>
            <div className="exlist">
              {day.exs.length === 0 && <p className="dim">Este día no tiene ejercicios. Tocá el lápiz para agregar.</p>}
              {day.exs.map((ex) => {
                const done = session.ticks?.[ex.id] || 0;
                const nSets = Number(ex.sets) || 0;
                const sets = Array.from({length: nSets}, (_,i) => i);
                return (
                  <div key={ex.id} className={`exrow ${done === nSets && nSets > 0 ? "complete" : ""}`}>
                    <div className="exinfo">
                      <p className="exname">{ex.n}</p>
                      <p className="dim sm">{ex.sets} series · {ex.reps} reps</p>
                    </div>
                    <div className="exsets">
                      {sets.map(s => (
                        <button key={s} type="button" className={`setbtn ${s < done ? "on" : ""}`} onClick={() => tickSet(ex.id, s, nSets)}>
                          {s < done ? <Check size={14}/> : s+1}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )
      )}

      {!editMode && (
        <Card title="Tus números de Fase 1 (3 meses)">
          <div className="gym-stats-grid">
            <div className="gms-item"><p className="dim sm">Peso actual</p><p className="big">74 kg</p></div>
            <div className="gms-item"><p className="dim sm">Meta 3 meses</p><p className="big">69 kg</p></div>
            <div className="gms-item"><p className="dim sm">Días/semana</p><p className="big">{routine.filter(d => !d.rest).length}</p></div>
            <div className="gms-item"><p className="dim sm">Cardio post</p><p className="big">15-20′</p></div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================== NUTRICIÓN ============================== */
function Nutri({ nutriLog, setNutriLog, nutriGoals, setNutriGoals }) {
  const today = todayKey();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("todos");
  const [goalsOpen, setGoalsOpen] = useState(false);

  const todayEntries = nutriLog[today] || [];

  const totals = useMemo(() => {
    return todayEntries.reduce((acc, e) => {
      const food = FOOD_DB.find(f => f.id === e.id);
      if (!food) return acc;
      const grams = e.isUnit ? (food.unitG || 100) * e.qty : e.qty;
      const f = grams / 100;
      return {
        kcal: acc.kcal + food.kcal * f,
        p: acc.p + food.p * f,
        f: acc.f + food.f * f,
        c: acc.c + food.c * f,
      };
    }, { kcal:0, p:0, f:0, c:0 });
  }, [todayEntries]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2 && catFilter === "todos") return [];
    return FOOD_DB.filter(f => {
      if (catFilter !== "todos" && f.cat !== catFilter) return false;
      if (q.length < 2) return true;
      return f.name.toLowerCase().includes(q);
    }).slice(0, 20);
  }, [search, catFilter]);

  const addEntry = (food, qty, isUnit) => {
    setNutriLog(prev => ({
      ...prev,
      [today]: [...(prev[today] || []), { id: food.id, qty, isUnit, at: Date.now() }]
    }));
    setSearch("");
  };
  const delEntry = (idx) => {
    setNutriLog(prev => ({
      ...prev,
      [today]: (prev[today] || []).filter((_,i) => i !== idx)
    }));
  };

  /* gráfico últimos 7 días */
  const weekData = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0,10);
      const entries = nutriLog[k] || [];
      const t = entries.reduce((acc, e) => {
        const food = FOOD_DB.find(f => f.id === e.id);
        if (!food) return acc;
        const grams = e.isUnit ? (food.unitG || 100) * e.qty : e.qty;
        return acc + food.kcal * grams / 100;
      }, 0);
      arr.push({ d: DAYS[(d.getDay()+6)%7][0], kcal: Math.round(t) });
    }
    return arr;
  }, [nutriLog]);

  const Macro = ({ label, current, goal, color }) => {
    const pct = Math.min(150, goal ? (current/goal)*100 : 0);
    const over = current > goal * 1.1;
    const ok = current >= goal*0.9 && current <= goal*1.1;
    return (
      <div className="macrocell">
        <div className="mcrow"><span className="dim sm">{label}</span><span className="mcval">{Math.round(current)}<span className="dim sm"> / {goal}</span></span></div>
        <div className="track"><div className="fill" style={{width:`${Math.min(100,pct)}%`,background: over ? "#f87171" : (ok ? color : color)}}/></div>
      </div>
    );
  };

  return (
    <div className="stack">
      <div className="pagehead">
        <div>
          <h2 className="h2">Nutrición</h2>
          <p className="dim sm">Hoy · {new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</p>
        </div>
        <button type="button" className="ghostbtn" onClick={() => setGoalsOpen(true)}>Ajustar objetivos</button>
      </div>

      <Card>
        <div className="macrobig">
          <div>
            <p className="dim sm">Calorías hoy</p>
            <p className="kcal-big">{Math.round(totals.kcal)}<span className="dim sm"> / {nutriGoals.kcal}</span></p>
            <div className="track" style={{marginTop:10}}>
              <div className="fill" style={{width:`${Math.min(100,(totals.kcal/nutriGoals.kcal)*100)}%`,background: totals.kcal > nutriGoals.kcal*1.1 ? "#f87171" : "#34d399"}}/>
            </div>
            <p className="dim sm" style={{marginTop:8}}>
              {totals.kcal < nutriGoals.kcal*0.9 ? `Te faltan ${Math.round(nutriGoals.kcal-totals.kcal)} kcal` :
               totals.kcal > nutriGoals.kcal*1.1 ? `Te pasaste ${Math.round(totals.kcal-nutriGoals.kcal)} kcal` :
               "En rango ✔"}
            </p>
          </div>
          <div className="macros-grid">
            <Macro label="Proteína (g)" current={totals.p} goal={nutriGoals.p} color="#2dd4bf"/>
            <Macro label="Grasas (g)" current={totals.f} goal={nutriGoals.f} color="#fbbf24"/>
            <Macro label="Carbos (g)" current={totals.c} goal={nutriGoals.c} color="#a78bfa"/>
          </div>
        </div>
      </Card>

      <Card title="Agregar comida">
        <div className="searchwrap-nutri">
          <Search size={17} className="dim"/>
          <input className="inp grow" placeholder="Buscar (escribí 2+ letras)" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filters" style={{marginTop:14}}>
          <button type="button" className={`fchip ${catFilter === "todos" ? "on" : ""}`} onClick={() => setCatFilter("todos")}>Todos</button>
          {Object.entries(FOOD_CATS).map(([k,c]) => (
            <button key={k} type="button" className={`fchip ${catFilter === k ? "on" : ""}`} onClick={() => setCatFilter(k)}>{c.label}</button>
          ))}
        </div>
        <div className="foodlist">
          {results.length === 0 && <p className="dim" style={{padding:"20px 0"}}>{search.length < 2 && catFilter === "todos" ? "Escribí algo o elegí una categoría." : "Sin resultados."}</p>}
          {results.map(food => <FoodRow key={food.id} food={food} onAdd={addEntry}/>)}
        </div>
      </Card>

      <Card title="Comido hoy" right={todayEntries.length > 0 && <span className="dim sm">{todayEntries.length} ítems</span>}>
        <div className="entrylist">
          {todayEntries.length === 0 && <p className="dim">Nada cargado todavía.</p>}
          {todayEntries.map((e,i) => {
            const food = FOOD_DB.find(f => f.id === e.id);
            if (!food) return null;
            const grams = e.isUnit ? (food.unitG || 100) * e.qty : e.qty;
            const fact = grams / 100;
            return (
              <div key={i} className="entry">
                <div className="entry-info">
                  <p className="entry-name">{food.name}</p>
                  <p className="dim sm">
                    {e.isUnit ? `${e.qty} ${food.unit}${e.qty>1?"s":""} · ${Math.round(grams)}g` : `${e.qty}g`}
                    {" · "}{Math.round(food.kcal*fact)} kcal · {Math.round(food.p*fact)}p · {Math.round(food.f*fact)}g · {Math.round(food.c*fact)}c
                  </p>
                </div>
                <button type="button" className="rowdel" onClick={() => delEntry(i)}><X size={14}/></button>
              </div>
            );
          })}
        </div>
      </Card>

      {weekData.some(d => d.kcal > 0) && (
        <Card title="Calorías últimos 7 días">
          <div className="chart">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekData} margin={{top:10,right:10,left:-20,bottom:0}}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false}/>
                <XAxis dataKey="d" tick={{fill:"rgba(255,255,255,0.5)",fontSize:12}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"rgba(255,255,255,0.4)",fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill:"rgba(52,211,153,0.08)"}} contentStyle={{background:"#06231a",border:"1px solid rgba(52,211,153,0.3)",borderRadius:12,color:"#fff"}}/>
                <ReBar dataKey="kcal" fill="#34d399" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {goalsOpen && <GoalsModal goals={nutriGoals} onSave={(g) => { setNutriGoals(g); setGoalsOpen(false); }} onClose={() => setGoalsOpen(false)}/>}
    </div>
  );
}

function FoodRow({ food, onAdd }) {
  const hasUnit = !!food.unit;
  const [qty, setQty] = useState(hasUnit ? 1 : 100);
  const [mode, setMode] = useState(hasUnit ? "unit" : "g");
  const grams = mode === "unit" ? (food.unitG || 100) * qty : qty;
  const f = grams / 100;
  const cat = FOOD_CATS[food.cat];

  return (
    <div className="foodrow">
      <div className="fr-main">
        <p className="fr-name">{food.name}</p>
        <p className="dim sm">
          {Math.round(food.kcal*f)} kcal · P {Math.round(food.p*f)}g · G {Math.round(food.f*f)}g · C {Math.round(food.c*f)}g
        </p>
      </div>
      <div className="fr-ctrl">
        {hasUnit && (
          <div className="modeswt">
            <button type="button" className={mode === "unit" ? "on" : ""} onClick={() => { setMode("unit"); setQty(1); }}>{food.unit}</button>
            <button type="button" className={mode === "g" ? "on" : ""} onClick={() => { setMode("g"); setQty(100); }}>g</button>
          </div>
        )}
        <input className="inp qty" type="number" min="1" value={qty} onChange={e => setQty(Math.max(1,+e.target.value || 1))}/>
        <button type="button" className="primary sm fr-add" onClick={() => onAdd(food, qty, mode === "unit")}><Plus size={14}/></button>
      </div>
    </div>
  );
}

function GoalsModal({ goals, onSave, onClose }) {
  const [g, setG] = useState(goals);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modalhead">
          <h3 className="h3">Objetivos diarios</h3>
          <button type="button" className="iconbtn" onClick={onClose}><X size={18}/></button>
        </div>
        <p className="dim sm" style={{marginBottom:18}}>Ajustá tus metas. Recomendado para Fase 1 cut: 2050 kcal · 160p · 60g · 200c.</p>
        <div className="gform">
          <label>Calorías (kcal)<input className="inp" type="number" value={g.kcal} onChange={e => setG({...g, kcal:+e.target.value})}/></label>
          <label>Proteínas (g)<input className="inp" type="number" value={g.p} onChange={e => setG({...g, p:+e.target.value})}/></label>
          <label>Grasas (g)<input className="inp" type="number" value={g.f} onChange={e => setG({...g, f:+e.target.value})}/></label>
          <label>Carbohidratos (g)<input className="inp" type="number" value={g.c} onChange={e => setG({...g, c:+e.target.value})}/></label>
        </div>
        <button type="button" className="primary" style={{marginTop:18,width:"100%"}} onClick={() => onSave(g)}><Check size={18}/> Guardar</button>
      </div>
    </div>
  );
}

/* ============================== STATS ============================== */
function Stats({ focus, tasks, goals, totalStreak }) {
  const data = DAYS.map((d, i) => ({
    d, enfoque: focus[i],
    tareas: tasks.filter(t => t.day === i && t.done).length,
  }));
  const focusTotal = focus.reduce((a,b) => a+b, 0);
  const tasksDone = tasks.filter(t => t.done).length;
  const avgGoal = Math.round(Object.values(goals).reduce((a,b) => a+b, 0)/4);

  return (
    <div className="stack">
      <h2 className="h2">Estadísticas</h2>
      <div className="kpis">
        <KPI label="Enfoque semanal" value={`${Math.round(focusTotal/60*10)/10}h`} sub={`${focusTotal} min`}/>
        <KPI label="Tareas hechas" value={tasksDone} sub={`de ${tasks.length}`}/>
        <KPI label="Racha máxima" value={totalStreak} sub="días"/>
        <KPI label="Progreso global" value={`${avgGoal}%`} sub="objetivos"/>
      </div>
      <Card title="Enfoque por día (min)">
        <div className="chart">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{top:10,right:10,left:-20,bottom:0}}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity={0.5}/><stop offset="100%" stopColor="#34d399" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false}/>
              <XAxis dataKey="d" tick={{fill:"rgba(255,255,255,0.5)",fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"rgba(255,255,255,0.4)",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:"#06231a",border:"1px solid rgba(52,211,153,0.3)",borderRadius:12,color:"#fff"}}/>
              <Area type="monotone" dataKey="enfoque" stroke="#34d399" strokeWidth={2.5} fill="url(#g1)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="two-col">
        <Card title="Tareas completadas por día">
          <div className="chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{top:10,right:10,left:-20,bottom:0}}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false}/>
                <XAxis dataKey="d" tick={{fill:"rgba(255,255,255,0.5)",fontSize:12}} axisLine={false} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{fill:"rgba(255,255,255,0.4)",fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill:"rgba(52,211,153,0.08)"}} contentStyle={{background:"#06231a",border:"1px solid rgba(52,211,153,0.3)",borderRadius:12,color:"#fff"}}/>
                <ReBar dataKey="tareas" fill="#2dd4bf" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Balance por área">
          <div className="goals">
            {Object.entries(goals).map(([k,v]) => (
              <div key={k} className="goalrow">
                <div className="goalhead"><span>{CATS[k].label}</span><span>{v}%</span></div>
                <Bar pct={v} color={CATS[k].color}/>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== ENFOQUE ============================== */
function Enfoque({ addFocus, focusToday, notif, toggleNotif }) {
  const MODES = [
    { id: "deep",  label: "Deep Work", min: 50 },
    { id: "pomo",  label: "Pomodoro",  min: 25 },
    { id: "break", label: "Descanso",  min: 5  },
  ];
  const loadState = () => load("temple_timer", { modeId: "deep", endAt: null, totalMs: MODES[0].min*60*1000, sessions: 0 });
  const [state, setState] = useState(loadState);
  const [now, setNow] = useState(Date.now());
  const mode = MODES.find(m => m.id === state.modeId) || MODES[0];
  const running = state.endAt !== null && state.endAt > now;
  const finished = state.endAt !== null && state.endAt <= now;

  useEffect(() => { localStorage.setItem("temple_timer", JSON.stringify(state)); }, [state]);
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(iv); }, []);
  useEffect(() => {
    if (finished) {
      if (state.modeId !== "break") {
        addFocus(mode.min);
        setState(s => ({...s, endAt:null, sessions: s.sessions+1, totalMs: mode.min*60*1000}));
      } else {
        setState(s => ({...s, endAt:null, totalMs: mode.min*60*1000}));
      }
      showNotif(state.modeId === "break" ? "Fin del descanso" : "Sesión terminada",
        state.modeId === "break" ? "Volvé a la carga." : `Llevás ${focusToday + mode.min} min de enfoque hoy.`);
    }
  }, [finished]);

  const remainMs = state.endAt ? Math.max(0, state.endAt - now) : state.totalMs;
  const secs = Math.ceil(remainMs/1000);
  const mm = String(Math.floor(secs/60)).padStart(2,"0");
  const ss = String(secs%60).padStart(2,"0");
  const pct = state.endAt ? Math.min(100, (1 - remainMs/state.totalMs)*100) : 0;

  const pick = (m) => setState({modeId: m.id, endAt:null, totalMs: m.min*60*1000, sessions: state.sessions});
  const startStop = async () => {
    if (running) {
      const remain = state.endAt - now;
      setState(s => ({...s, endAt:null, totalMs: remain}));
    } else {
      if (notif.status !== "granted") await toggleNotif();
      setState(s => ({...s, endAt: now + s.totalMs}));
    }
  };
  const reset = () => setState({modeId: mode.id, endAt: null, totalMs: mode.min*60*1000, sessions: state.sessions});

  return (
    <div className="stack">
      <h2 className="h2">Modo Enfoque</h2>
      <div className="focuswrap">
        <div className="modeswitch">
          {MODES.map(m => (
            <button key={m.id} type="button" className={`mbtn ${mode.id === m.id ? "on" : ""}`} onClick={() => pick(m)} disabled={running}>{m.label}<span>{m.min}′</span></button>
          ))}
        </div>
        <div className={`timer ${running ? "live" : ""}`}>
          <svg viewBox="0 0 220 220" className="timer-svg">
            <circle cx="110" cy="110" r="96" className="t-bg"/>
            <circle cx="110" cy="110" r="96" className="t-fg" strokeDasharray={2*Math.PI*96} strokeDashoffset={2*Math.PI*96*(1 - pct/100)}/>
          </svg>
          <div className="timer-inner">
            <p className="timer-time">{mm}:{ss}</p>
            <p className="dim">{mode.label}</p>
          </div>
        </div>
        <div className="timer-ctrl">
          <button type="button" className="iconbtn lg" onClick={reset}><RotateCcw size={20}/></button>
          <button type="button" className="primary lg" onClick={startStop}>
            {running ? <><Pause size={20}/> Pausar</> : <><Play size={20}/> Empezar</>}
          </button>
          <div className="sessioncount"><p className="big">{state.sessions}</p><p className="dim sm">sesiones</p></div>
        </div>
        {running && <p className="dim center" style={{maxWidth:380,fontSize:13}}>Podés cerrar la app: el tiempo se calcula por reloj real. Te aviso cuando termine.</p>}
        <p className="dim center">Enfoque acumulado hoy: <b style={{color:"#34d399"}}>{focusToday} min</b></p>
      </div>
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */
function Card({ title, right, accent, glass, children }) {
  return (
    <section className={`card ${accent ? "accent" : ""} ${glass ? "glasscard" : ""}`}>
      {(title || right) && <div className="cardhead">{title && <h3 className="cardtitle">{title}</h3>}{right}</div>}
      {children}
    </section>
  );
}
function Bar({ pct, color }) { return <div className="track"><div className="fill" style={{width:`${pct}%`,background:color}}/></div>; }
function Ring({ pct, size=64 }) {
  const r = size/2-5, c = 2*Math.PI*r;
  return <svg width={size} height={size} className="ring">
    <circle cx={size/2} cy={size/2} r={r} className="r-bg"/>
    <circle cx={size/2} cy={size/2} r={r} className="r-fg" strokeDasharray={c} strokeDashoffset={c*(1-pct/100)}/>
  </svg>;
}
function KPI({ label, value, sub }) { return <div className="kpi"><p className="dim sm">{label}</p><p className="kpival">{value}</p><p className="dim sm">{sub}</p></div>; }

/* ----------------------------- styles ----------------------------- */
function Style() {
  return (<style>{`
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body,#root{width:100%;min-height:100%}
body{background:#03130d}
::-webkit-scrollbar{width:8px}::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(52,211,153,.22);border-radius:20px}
::-webkit-scrollbar-thumb:hover{background:rgba(52,211,153,.4)}

.tos{--bg:#03130d;--panel:rgba(255,255,255,.045);--line:rgba(255,255,255,.09);
  --em:#34d399;--em2:#2dd4bf;--txt:#eafff6;--dim:rgba(234,255,246,.45);
  font-family:'Manrope',system-ui,sans-serif;color:var(--txt);min-height:100vh;
  background:var(--bg);position:relative;overflow-x:hidden;padding:18px}
.bg-glow{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0}
.bg-glow.a{top:-160px;left:30%;width:560px;height:560px;background:radial-gradient(circle,rgba(0,255,170,.22),transparent 70%);animation:breathe 7s ease-in-out infinite}
.bg-glow.b{bottom:-200px;right:-80px;width:480px;height:480px;background:radial-gradient(circle,rgba(0,255,170,.10),transparent 70%);animation:breathe 9s ease-in-out infinite}
@keyframes breathe{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.1);opacity:1}}
.shell{position:relative;z-index:1;max-width:1320px;margin:0 auto;border:1px solid var(--line);
  border-radius:34px;background:rgba(255,255,255,.04);backdrop-filter:blur(26px);overflow:hidden;
  box-shadow:0 40px 120px -40px rgba(0,0,0,.8)}
h1,h2,h3,h4{font-family:'Sora',sans-serif;font-weight:700;letter-spacing:-.02em}
.dim{color:var(--dim)}.sm{font-size:12px}.center{text-align:center}
.eyebrow{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.32em;margin-bottom:4px}
.h2{font-size:28px}.h3{font-size:22px}
.topbar{display:flex;align-items:center;gap:18px;padding:18px 26px;border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:13px;min-width:170px}
.logo{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;font-size:22px;
  background:linear-gradient(135deg,rgba(52,211,153,.3),rgba(45,212,191,.08));border:1px solid rgba(52,211,153,.25)}
.brand-name{font-size:19px}
.searchwrap{flex:1;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);
  border:1px solid var(--line);border-radius:16px;padding:11px 18px;max-width:440px}
.searchwrap input{background:none;border:none;outline:none;color:var(--txt);width:100%;font-size:14px;font-family:inherit}
.searchwrap input::placeholder{color:var(--dim)}
.searchwrap-nutri{display:flex;align-items:center;gap:10px}
.topright{display:flex;align-items:center;gap:12px;margin-left:auto}
.streak-pill{display:flex;align-items:center;gap:6px;background:rgba(52,211,153,.14);color:var(--em);
  border:1px solid rgba(52,211,153,.25);padding:8px 13px;border-radius:13px;font-weight:700;font-size:14px}
.avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#34d399,#2dd4bf);
  display:grid;place-items:center;color:#032018;font-weight:800}
.body{display:flex;min-height:calc(100vh - 90px)}
.sidebar{width:96px;border-right:1px solid var(--line);padding:20px 12px;display:flex;flex-direction:column;gap:8px}
.navbtn{border:1px solid transparent;background:none;color:var(--dim);padding:12px 8px;border-radius:16px;
  cursor:pointer;transition:.2s;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;font-family:inherit}
.navbtn:hover{background:rgba(255,255,255,.04);color:white}
.navbtn.on{background:linear-gradient(135deg,rgba(52,211,153,.18),rgba(45,212,191,.08));color:white;border:1px solid rgba(52,211,153,.18)}
.content{flex:1;padding:26px;min-width:0;animation:fade .35s ease;overflow-x:hidden}
@keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.stack{display:flex;flex-direction:column;gap:22px}
.pagehead{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:24px;padding:22px;backdrop-filter:blur(18px)}
.cardhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;gap:12px;flex-wrap:wrap}
.cardtitle{font-size:18px}
.glasscard{background:linear-gradient(135deg,rgba(52,211,153,.08),rgba(255,255,255,.03))}
.accent{border-color:rgba(52,211,153,.2)}
.day-ring{display:flex;align-items:center;gap:12px}
.big{font-family:'Sora';font-size:24px;font-weight:700;line-height:1}
.ring{transform:rotate(-90deg)}
.ring .r-bg{fill:none;stroke:rgba(255,255,255,.1);stroke-width:8}
.ring .r-fg{fill:none;stroke:var(--em);stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .6s ease}
.task-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.task-card{position:relative;padding:18px;border-radius:20px;border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.03);cursor:pointer;transition:.25s;text-align:left;color:white;font-family:inherit;
  min-height:140px;display:flex;flex-direction:column;justify-content:space-between}
.task-card:hover{transform:translateY(-4px);border-color:var(--c)}
.task-card.done{opacity:.6}.task-card.done h4{text-decoration:line-through}
.tc-top{display:flex;justify-content:space-between}
.tc-time{font-size:13px;color:var(--dim)}.task-card h4{font-size:16px;margin:8px 0}
.check{position:absolute;bottom:16px;right:16px;color:#34d399}
.goals{display:flex;flex-direction:column;gap:16px}
.goalhead{display:flex;justify-content:space-between;font-size:13px;color:var(--dim);margin-bottom:7px}
.track{width:100%;height:10px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
.fill{height:100%;border-radius:999px;transition:width .6s ease}
.resumen{display:flex;flex-direction:column;gap:9px;line-height:1.4;font-size:14px}
.resumen .warn{color:#fbbf24}
.mini-stats{display:flex;gap:30px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}
.cta-row{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.chips{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.chip{padding:7px 13px;border-radius:11px;background:rgba(0,0,0,.25);border:1px solid var(--line);font-size:13px}
.filters{display:flex;gap:9px;flex-wrap:wrap}
.fchip{padding:9px 16px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid var(--line);
  color:var(--dim);cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;transition:.18s}
.fchip:hover{color:var(--txt)}
.fchip.on{background:rgba(52,211,153,.16);color:var(--em);border-color:rgba(52,211,153,.35)}
.cal-mobile{display:none}
.cal{overflow:auto}
.cal-head,.cal-row{display:grid;grid-template-columns:90px repeat(7,1fr)}
.cal-day,.cal-time,.cal-cell{border:1px solid rgba(255,255,255,.05)}
.cal-day{padding:14px;text-align:center;font-weight:700;background:rgba(255,255,255,.03)}
.cal-day.today{color:#34d399}
.cal-time{padding:14px;color:var(--dim);font-size:13px}
.cal-cell{min-height:84px;padding:8px}
.cal-ev{width:100%;border:none;padding:10px;border-radius:12px;background:rgba(52,211,153,.15);color:white;
  cursor:pointer;margin-bottom:6px;border-left:4px solid var(--c);text-align:left;font-family:inherit}
.cal-ev.done{opacity:.5;text-decoration:line-through}
.cal-day-nav{display:flex;align-items:center;gap:14px;margin-bottom:14px;justify-content:space-between}
.cal-day-title{text-align:center;flex:1}
.cal-day-list{display:flex;flex-direction:column;gap:10px}
.cal-day-row{display:flex;align-items:center;gap:14px;padding:14px;border-radius:16px;background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.06);border-left:3px solid var(--c);color:#eafff6;cursor:pointer;font-family:inherit;text-align:left}
.cal-day-row.done{opacity:.55;text-decoration:line-through}
.cdr-time{color:var(--dim);font-size:13px;font-weight:700;min-width:48px}
.cdr-title{flex:1}
.weeknav{display:flex;align-items:center;gap:12px;font-size:14px;color:var(--dim)}
.tasklist{display:flex;flex-direction:column;gap:14px}
.taskrow{display:flex;align-items:center;gap:16px;padding:18px;border-radius:20px;background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.06);border-left:3px solid var(--c);transition:.25s}
.taskrow:hover{transform:translateY(-2px);border-color:rgba(52,211,153,.25);background:rgba(255,255,255,.05)}
.taskrow.done{opacity:.6}.taskrow.done .rowtitle{text-decoration:line-through}
.rowcheck{width:36px;height:36px;border-radius:12px;border:1.5px solid var(--c);cursor:pointer;display:grid;place-items:center;background:rgba(52,211,153,.12);color:#34d399;flex-shrink:0}
.taskrow.done .rowcheck{background:var(--c);color:#03130d}
.rowmain{display:flex;flex-direction:column;gap:4px;flex:1;text-align:left;min-width:0}
.rowtitle{font-size:15px;font-weight:700}
.rowmeta{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dim)}
.rowedit{width:36px;height:36px;border:none;border-radius:10px;background:rgba(255,255,255,.05);color:#eafff6;cursor:pointer;display:grid;place-items:center;flex-shrink:0;transition:.2s}
.rowedit:hover{background:rgba(52,211,153,.15);color:#34d399}
.rowdel{width:36px;height:36px;border:none;border-radius:12px;cursor:pointer;background:rgba(255,255,255,.04);color:#ff7b7b;display:grid;place-items:center;flex-shrink:0}
.rowdel:hover{background:rgba(248,113,113,.15)}
.hablist{display:flex;flex-direction:column;gap:14px}
.habrow{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px;border-radius:20px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);transition:.25s}
.habrow:hover{border-color:rgba(52,211,153,.2);background:rgba(255,255,255,.05)}
.hableft{display:flex;align-items:center;gap:14px;min-width:0}
.habtime-col{min-width:52px;display:flex;justify-content:center}
.habtime{font-family:'Sora',sans-serif;font-weight:700;font-size:14px;color:#34d399;background:rgba(52,211,153,.12);padding:5px 9px;border-radius:9px;border:1px solid rgba(52,211,153,.2)}
.habtime.none{color:var(--dim);background:rgba(255,255,255,.04);border-color:var(--line);font-weight:400}
.habnamewrap{min-width:0}
.habicon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:rgba(52,211,153,.12);color:#34d399;flex-shrink:0}
.habname{font-weight:700}
.habrow .sm{display:flex;align-items:center;gap:4px;margin-top:2px}
.habweek{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}
.dot{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.05);color:rgba(255,255,255,.45);font-size:11px;font-weight:700}
.dot.fill{background:#34d399;color:#03130d}
.dot.today{outline:2px solid rgba(52,211,153,.6);outline-offset:1px}
.habtoggle{width:46px;height:46px;border:none;border-radius:14px;cursor:pointer;background:rgba(255,255,255,.06);color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.habtoggle.on{background:#34d399;color:#03130d}

/* GYM */
.gym-week{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
.gym-day-pill{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;transition:.2s;font-family:inherit;color:#eafff6;position:relative}
.gym-day-pill:hover{background:rgba(255,255,255,.07)}
.gym-day-pill.on{background:rgba(52,211,153,.18);border-color:rgba(52,211,153,.35);color:#34d399}
.gym-day-pill.rest{opacity:.55}
.gym-day-pill.trained{border-color:rgba(52,211,153,.45)}
.gdp-day{font-weight:800;font-size:14px}
.gdp-name{font-size:11px;color:var(--dim);text-align:center;line-height:1.2}
.gym-day-pill.on .gdp-name{color:#34d399}
.gdp-check{position:absolute;top:6px;right:6px;color:#34d399}
.exlist{display:flex;flex-direction:column;gap:12px}
.exrow{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);transition:.25s}
.exrow.complete{background:rgba(52,211,153,.08);border-color:rgba(52,211,153,.25)}
.exinfo{flex:1;min-width:0}
.exname{font-weight:700;font-size:15px;margin-bottom:3px}
.exsets{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.setbtn{width:36px;height:36px;border-radius:10px;border:1.5px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:var(--dim);cursor:pointer;font-weight:700;font-family:inherit;font-size:13px;display:grid;place-items:center;transition:.18s}
.setbtn:hover{border-color:#34d399;color:white}
.setbtn.on{background:#34d399;border-color:#34d399;color:#03130d}
.rest-day{display:flex;flex-direction:column;align-items:center;padding:40px 20px;text-align:center}
.gym-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.gms-item{background:rgba(0,0,0,.2);border:1px solid var(--line);border-radius:16px;padding:16px;text-align:center}
.iconbtn.edit-on{background:#34d399;color:#03130d;border-color:#34d399}
.gym-day-pill.add{border-style:dashed;color:var(--dim);justify-content:center}
.gym-day-pill.add:hover{color:#34d399;border-color:rgba(52,211,153,.4)}
.edit-day-head{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
.edit-field{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--dim)}
.edit-field span{font-weight:600}
.rest-toggle .toggle{height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.06);color:#eafff6;cursor:pointer;font-family:inherit;font-weight:700;font-size:14px}
.rest-toggle .toggle.on{background:rgba(52,211,153,.18);border-color:rgba(52,211,153,.35);color:#34d399}
.exedit-list{display:flex;flex-direction:column;gap:10px}
.exedit{display:flex;align-items:center;gap:8px;padding:10px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
.exedit-order{display:flex;flex-direction:column;gap:2px}
.exedit-order button{width:26px;height:20px;border:none;background:rgba(255,255,255,.05);color:var(--dim);border-radius:6px;cursor:pointer;display:grid;place-items:center}
.exedit-order button:hover:not(:disabled){background:rgba(52,211,153,.15);color:#34d399}
.exedit-order button:disabled{opacity:.25;cursor:not-allowed}
.exedit-name{flex:1;min-width:0;height:42px}
.exedit-num{width:56px;height:42px;text-align:center;padding:0 6px}
.exedit-reps{width:70px;height:42px;text-align:center;padding:0 8px}
.exedit-x{color:var(--dim);font-size:13px}
.edit-day-footer{margin-top:20px;padding-top:18px;border-top:1px solid var(--line);display:flex;justify-content:flex-end}
.rowdel-btn{display:inline-flex;align-items:center;gap:8px;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.25);color:#ff7b7b;padding:11px 18px;border-radius:14px;cursor:pointer;font-family:inherit;font-weight:700;font-size:13px}
.rowdel-btn:hover{background:rgba(248,113,113,.2)}

/* NUTRI */
.macrobig{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.kcal-big{font-family:'Sora';font-size:42px;font-weight:800;color:#34d399;margin-top:6px;line-height:1}
.macros-grid{display:flex;flex-direction:column;gap:14px;justify-content:center}
.macrocell{display:flex;flex-direction:column;gap:6px}
.mcrow{display:flex;justify-content:space-between;align-items:center}
.mcval{font-family:'Sora';font-weight:700}
.foodlist{display:flex;flex-direction:column;gap:10px;margin-top:14px;max-height:420px;overflow:auto}
.foodrow{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
.fr-main{flex:1;min-width:0}
.fr-name{font-weight:600;font-size:14px;margin-bottom:3px}
.fr-ctrl{display:flex;align-items:center;gap:8px;flex-shrink:0}
.modeswt{display:flex;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.modeswt button{background:rgba(255,255,255,.04);border:none;color:var(--dim);padding:8px 10px;font-size:12px;font-family:inherit;cursor:pointer;font-weight:600}
.modeswt button.on{background:#34d399;color:#03130d}
.qty{width:70px;height:38px;text-align:center;padding:0 8px;font-size:13px}
.fr-add{padding:8px 12px;border-radius:10px;height:38px}
.entrylist{display:flex;flex-direction:column;gap:10px}
.entry{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
.entry-info{flex:1;min-width:0}
.entry-name{font-weight:600;font-size:14px;margin-bottom:2px}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:100;display:grid;place-items:center;padding:20px}
.modal{background:#06231a;border:1px solid rgba(52,211,153,.25);border-radius:24px;padding:28px;max-width:420px;width:100%}
.modalhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.gform{display:flex;flex-direction:column;gap:14px}
.gform label{display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--dim)}
.gform input{height:44px}

/* STATS / FOCUS */
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.kpi{border:1px solid var(--line);border-radius:20px;background:rgba(0,0,0,.25);padding:18px}
.kpival{font-family:'Sora';font-size:30px;font-weight:700;margin:6px 0;color:var(--em)}
.chart{width:100%}
.addbar{display:flex;gap:12px;flex-wrap:wrap}
.inp{height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.06);color:#eafff6;padding:0 14px;outline:none;font-size:14px;font-family:inherit;transition:.2s;appearance:none}
.inp:focus{border-color:#34d399;box-shadow:0 0 0 4px rgba(52,211,153,.12)}
.inp:disabled{opacity:.4;cursor:not-allowed}
.grow{flex:1;min-width:180px}
select.inp{cursor:pointer}select.inp option{background:#06231a;color:#eafff6}
button{font-family:inherit}
.primary{display:flex;align-items:center;justify-content:center;gap:10px;border:none;cursor:pointer;padding:14px 20px;border-radius:18px;background:linear-gradient(135deg,#34d399,#10b981);color:#03130d;font-weight:800;font-family:'Sora',sans-serif;transition:.25s}
.primary:hover{transform:translateY(-2px);box-shadow:0 20px 40px rgba(52,211,153,.22)}
.primary.sm{padding:12px 16px;border-radius:14px;font-size:14px}
.primary.lg{padding:18px 26px;border-radius:22px;font-size:16px}
.ghostbtn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:var(--txt);padding:10px 16px;border-radius:12px;cursor:pointer;font-family:inherit;font-size:13px;display:inline-flex;align-items:center;gap:6px}
.ghostbtn:hover{color:#34d399}
.iconbtn{width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#eafff6;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.25s}
.iconbtn:hover{background:rgba(255,255,255,.09);transform:translateY(-2px)}
.iconbtn.lg{width:58px;height:58px;border-radius:18px}
.focuswrap{display:flex;flex-direction:column;align-items:center;gap:30px;padding:30px}
.modeswitch{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.mbtn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:var(--txt);border-radius:18px;padding:14px 20px;display:flex;align-items:center;gap:10px;cursor:pointer;font-weight:700;font-family:inherit}
.mbtn span{color:var(--dim);font-size:13px}
.mbtn:hover:not(:disabled){background:rgba(255,255,255,.08)}
.mbtn:disabled{opacity:.4;cursor:not-allowed}
.mbtn.on{background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.35);color:#34d399}
.timer{width:300px;height:300px;position:relative;display:grid;place-items:center}
.timer-svg{width:100%;height:100%;transform:rotate(-90deg)}
.t-bg{fill:none;stroke:rgba(255,255,255,.06);stroke-width:10}
.t-fg{fill:none;stroke:#34d399;stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset 1s linear}
.timer.live .t-fg{filter:drop-shadow(0 0 14px rgba(52,211,153,.6))}
.timer-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.timer-time{font-size:60px;font-family:'Sora',sans-serif;font-weight:800;letter-spacing:-.05em}
.timer-ctrl{display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center}
.sessioncount{text-align:center;min-width:80px}

@media(max-width:980px){
  .two-col,.kpis,.macrobig,.gym-stats-grid{grid-template-columns:1fr}
  .body{flex-direction:column}
  .sidebar{width:100%;flex-direction:row;overflow:auto;border-right:none;border-bottom:1px solid var(--line);padding:14px;gap:6px}
  .navbtn{padding:10px 12px;min-width:64px}
  .navbtn span{display:none}
  .topbar{flex-wrap:wrap}.searchwrap{display:none}
  .content{padding:18px}
  .timer{width:260px;height:260px}.timer-time{font-size:48px}
  .cal-desktop{display:none}
  .cal-mobile{display:block}
  .gym-stats-grid{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:560px){
  .kpis,.gym-stats-grid{grid-template-columns:1fr 1fr}.tos{padding:8px}
  .habrow{flex-wrap:wrap;justify-content:flex-start;gap:12px}
  .hableft{width:100%;order:1}
  .habweek{order:3;width:100%;justify-content:space-between;margin-left:0;gap:5px}
  .habtoggle{order:2;margin-left:auto}
  .habrow .rowdel{order:2}
  .dot{width:34px;height:34px;flex:1;max-width:42px}
  .habname{font-size:15px}
  .pagehead{flex-direction:column;align-items:flex-start;gap:10px}
  .h2{font-size:22px}
  .addbar{flex-direction:column}
  .addbar .inp,.addbar .grow,.addbar .primary{width:100%}
  .task-grid{grid-template-columns:1fr 1fr}
  .modeswitch{width:100%}
  .timer-time{font-size:44px}
  .gym-week{grid-template-columns:repeat(4,1fr)}
  .edit-day-head{grid-template-columns:1fr}
  .exedit{flex-wrap:wrap}
  .exedit-name{flex-basis:100%;order:1}
  .exedit-order{order:2}
  .exedit-num,.exedit-x,.exedit-reps{order:3}
  .exedit .rowdel{order:4;margin-left:auto}
  .exrow{flex-direction:column;align-items:stretch;gap:12px}
  .exsets{justify-content:flex-start}
  .foodrow{flex-direction:column;align-items:stretch;gap:10px}
  .fr-ctrl{justify-content:flex-end}
}
`}</style>);
}
