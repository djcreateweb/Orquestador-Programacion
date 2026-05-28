-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: valosensebdd
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `valosensebdd`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `valosensebdd` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `valosensebdd`;

--
-- Table structure for table `agente`
--

DROP TABLE IF EXISTS `agente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `agente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `rol` enum('Duelist','Initiator','Controller','Sentinel') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_ag_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agente`
--

LOCK TABLES `agente` WRITE;
/*!40000 ALTER TABLE `agente` DISABLE KEYS */;
INSERT INTO `agente` VALUES (1,'Jett','Duelist'),(2,'Reyna','Duelist'),(3,'Raze','Duelist'),(4,'Phoenix','Duelist'),(5,'Yoru','Duelist'),(6,'Neon','Duelist'),(7,'Iso','Duelist'),(8,'Sova','Initiator'),(9,'Breach','Initiator'),(10,'Skye','Initiator'),(11,'KAY/O','Initiator'),(12,'Fade','Initiator'),(13,'Gekko','Initiator'),(14,'Brimstone','Controller'),(15,'Viper','Controller'),(16,'Omen','Controller'),(17,'Astra','Controller'),(18,'Harbor','Controller'),(19,'Clove','Controller'),(20,'Sage','Sentinel'),(21,'Cypher','Sentinel'),(22,'Killjoy','Sentinel'),(23,'Chamber','Sentinel'),(24,'Deadlock','Sentinel'),(25,'Vyse','Sentinel');
/*!40000 ALTER TABLE `agente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agente_favorito`
--

DROP TABLE IF EXISTS `agente_favorito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `agente_favorito` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `agente_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_usuario_agente` (`usuario_id`,`agente_id`),
  KEY `FK_af_agente` (`agente_id`),
  CONSTRAINT `FK_af_agente` FOREIGN KEY (`agente_id`) REFERENCES `agente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_af_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agente_favorito`
--

LOCK TABLES `agente_favorito` WRITE;
/*!40000 ALTER TABLE `agente_favorito` DISABLE KEYS */;
INSERT INTO `agente_favorito` VALUES (1,2,1),(2,2,20),(3,3,4),(4,3,14),(5,4,2),(6,4,16),(7,5,3),(8,5,21),(11,6,1),(9,6,8),(10,6,22),(13,7,11),(12,7,23),(16,8,6),(15,8,8),(14,8,15),(18,9,10),(17,9,17),(19,10,19),(20,10,24),(21,11,1),(22,11,9),(23,11,21),(25,12,12),(24,12,16),(28,13,1),(27,13,8),(26,13,23),(30,14,11),(29,14,15),(31,14,22),(32,15,3),(33,15,16),(34,15,21),(35,16,1),(36,16,17),(37,16,22),(40,17,12),(39,17,15),(38,17,23),(41,18,1),(42,18,16),(43,19,1),(46,19,8),(44,19,15),(45,19,22),(47,20,1),(48,20,16);
/*!40000 ALTER TABLE `agente_favorito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agente_mapa_meta`
--

DROP TABLE IF EXISTS `agente_mapa_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `agente_mapa_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `agente_id` int(11) NOT NULL,
  `mapa` enum('Ascent','Bind','Breeze','Fracture','Haven','Icebox','Lotus','Pearl','Split','Sunset','Abyss') NOT NULL,
  `tier` enum('S','A','B') NOT NULL DEFAULT 'B',
  `nota` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_agente_mapa` (`agente_id`,`mapa`),
  CONSTRAINT `FK_amm_agente` FOREIGN KEY (`agente_id`) REFERENCES `agente` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agente_mapa_meta`
--

LOCK TABLES `agente_mapa_meta` WRITE;
/*!40000 ALTER TABLE `agente_mapa_meta` DISABLE KEYS */;
INSERT INTO `agente_mapa_meta` VALUES (78,1,'Ascent','S','Dash sobre mid y A site permite Op plays agresivos y salida limpia.'),(79,16,'Ascent','S','Humos globales cubren mid, A main y B main desde cualquier rinc?n.'),(80,22,'Ascent','S','Lockdown ulti cierra A site y turret anchorea B de forma casi gratis.'),(81,8,'Ascent','S','Lineups de recon y hunter?s fury barren mid, catwalk y ambos sitios.'),(82,11,'Ascent','A','Flashes rectas de mid y knife suppression rompe setups de Killjoy/Cypher.'),(83,21,'Ascent','A','C?mara en heaven y tripwire en catwalk cubren mid y flancos.'),(84,23,'Ascent','A','Op hold en A main y tele para reposicionar frente a pushes r?pidos.'),(85,3,'Ascent','A','Boombot limpia market y paint shells quiebran post-plant en ambos sitios.'),(86,19,'Ascent','A','Humos recargables y revive aguantan 1v1 tras trades en mid.'),(87,6,'Ascent','B','Slide a mid funciona, pero Jett sigue siendo mejor Op en este mapa.'),(88,4,'Ascent','B','Flash curve y wall ayudan en A main, aunque pierde frente a Jett.'),(89,9,'Ascent','B','Faults y ult ?tiles en A main, pero Ascent prefiere double recon.'),(90,3,'Bind','S','Boombot en hookah y satchels en teles hacen de Bind su mejor mapa.'),(91,14,'Bind','S','Tres humos simult?neos ejecutan cualquier sitio sin depender de alcance.'),(92,21,'Bind','S','Tripwires en teles A y B cubren los dos flancos m?s peligrosos del juego.'),(93,15,'Bind','A','Muro parte A short y molly post-plant imparable en B site.'),(94,11,'Bind','A','Flash y suppression desactivan Cypher/Viper en ejecutes a sitio.'),(95,10,'Bind','A','Perro de info y flashes largas rompen hookah y showers.'),(96,12,'Bind','A','Prowlers localizan en pasillos cerrados y haunt revela post-humo.'),(97,13,'Bind','A','Wingman plantea y Dizzy dispara flashes en ejecutes cortos.'),(98,4,'Bind','B','Flash curve y wall ayudan a tradear en hookah, pero carece de movilidad.'),(99,1,'Bind','B','Dash viable en A short, pero Raze domina los ejecutes cerrados.'),(100,22,'Bind','B','Trampas funcionan en B site, aunque Cypher cubre mejor los teles.'),(101,16,'Haven','S','Humos globales cubren tres sitios con rotaciones lentas, tele decisivo.'),(102,8,'Haven','S','Dart revela A long, C long y garage con un solo recon bolt.'),(103,1,'Haven','S','Dash para tomar A long u Op hold en C long sin riesgo de reposici?n.'),(104,19,'Haven','S','Humos recargables y revive salvan sitios mientras el equipo rota.'),(105,21,'Haven','A','Cam en garage y tripwires cubren los flancos largos de tres sitios.'),(106,22,'Haven','A','Anchor s?lido en C long; ult cierra A site para retakes de 3.'),(107,9,'Haven','A','Faults y stuns abren C long y A short en pasillos estrechos.'),(108,12,'Haven','A','Haunt y prowlers limpian tres sitios y cubren rotaciones lentas.'),(109,10,'Haven','A','Flashes y perro de info ejecutan A short y C long con trades f?ciles.'),(110,3,'Haven','B','Nades ?tiles en A short, pero Jett aprovecha mejor la Op.'),(111,17,'Haven','B','Control global viable, aunque Omen y Clove dan m?s impacto individual.'),(112,11,'Haven','B','Supresi?n molesta al Cypher defensor, roster ya saturado de iniciadores.'),(113,15,'Breeze','S','Muro gigante parte A cave y mid, molly decay fija post-plants.'),(114,1,'Breeze','S','Dash y updraft crean Op holds agresivos en ?ngulos largu?simos.'),(115,23,'Breeze','S','Op estable a larga distancia y tele de emergencia ante flanks.'),(116,8,'Breeze','S','Dart cubre A cave, mid doors y B site desde un ?nico pixel.'),(117,21,'Breeze','A','Tripwires en tubos de A y mid cortan los dos flancos principales.'),(118,18,'Breeze','A','Muros de agua complementan a Viper y tapan angulos en ejecute de A.'),(119,10,'Breeze','A','Perro de info y heal cr?tico en un mapa con trades lentos.'),(120,11,'Breeze','A','Knife supresi?n rompe a Viper y Cypher en ejecutes largos.'),(121,13,'Breeze','B','Wingman plantea en site abierto, pero Sova recon es superior.'),(122,6,'Breeze','B','Velocidad para rotar, aunque Jett y Raze son mejores duelists aqu?.'),(123,3,'Breeze','B','Satchels cubren mucho terreno, pero no gana los duelos de Op.'),(124,15,'Icebox','S','Muro vertical y molly indispensables por la verticalidad del mapa.'),(125,8,'Icebox','S','Recon dart y hunter?s fury dominan mid y B site abiertos.'),(126,20,'Icebox','S','Muro eleva a nest y corta B kitchen, wall clutch post-plant en A.'),(127,1,'Icebox','S','Updraft+dash suben a yellow y nest para Op holds imposibles de replicar.'),(128,22,'Icebox','A','Turret y trampas blindan B site, ult fuerza el defuse en retakes.'),(129,23,'Icebox','A','Op hold en B tubes y tele para rotar entre mid y screens.'),(130,18,'Icebox','A','Muros extensos cubren A site abierto cuando Viper se gasta.'),(131,10,'Icebox','A','Heal y flashes compensan trades lentos en un mapa con Op pesado.'),(132,21,'Icebox','B','Tripwires viables en B kitchen, Killjoy rinde mejor en sitios abiertos.'),(133,12,'Icebox','B','Prowlers ayudan en mid, pero Sova sigue siendo el iniciador top.'),(134,3,'Icebox','B','Satchels para subir a yellow decentes, Jett domina los Op holds.'),(135,3,'Split','S','Boombot y nades devastan pasillos cerrados, satchel sube a A ramps.'),(136,16,'Split','S','Humos precisos en mid y ambos sitios, tele flanquea por vents.'),(137,20,'Split','S','Muro corta mid y ralentiza pushes, slow orbs cubren rotaciones cortas.'),(138,21,'Split','S','Cam en mid y tripwires en vents anulan flancos constantes.'),(139,9,'Split','A','Stuns y aftershock rompen defensas en A main y B mail.'),(140,10,'Split','A','Flashes curvas perfectas para A main, heal tras entradas brutales.'),(141,14,'Split','A','Humos simult?neos y molly ejecutan sitios peque?os sin problema.'),(142,12,'Split','A','Prowlers limpian mid mail y heaven, haunt revela anchors.'),(143,6,'Split','A','Slide por mid rompe el timing de los defensores en A main.'),(144,1,'Split','B','Dash a A ramps viable, pero Raze saca m?s valor de los espacios cerrados.'),(145,22,'Split','B','Setup en B site s?lido, Cypher cubre mejor los flancos de vents.'),(146,3,'Lotus','S','Granadas rebotan en C hall y A main estrechos, boombot limpia waterfall.'),(147,15,'Lotus','S','Muro dobla defensa de A site y molly corta C mound en post-plant.'),(148,22,'Lotus','S','Ult cierra sitio en retake de 3 sites y trampas blindan C link.'),(149,16,'Lotus','A','Humos globales y tele rotan entre tres sitios con puertas rotatorias.'),(150,12,'Lotus','A','Haunt revela detr?s de puertas giratorias y prowlers ciegan ejecutes.'),(151,10,'Lotus','A','Flashes y perro de info cr?ticos para tres sitios con trades lentos.'),(152,9,'Lotus','A','Stuns y faults rompen defensas en A main y C hall estrechos.'),(153,18,'Lotus','A','Segundo controller viable, muros cubren ejecute C y A link.'),(154,1,'Lotus','A','Dash de A main para Op agresiva, updraft a pillars clutch.'),(155,11,'Lotus','B','Knife suppression rompe Killjoy/Viper, pero compite con Fade y Skye.'),(156,21,'Lotus','B','Cam en C mound y tripwires en tree, Killjoy suele ganar el slot.'),(157,9,'Fracture','S','Mapa lineal dise?ado para faults y stuns, must-pick absoluto.'),(158,3,'Fracture','S','Satchels a dish y A site, nades en pasillos estrechos de ambos lados.'),(159,6,'Fracture','S','Slide por zipline acelera entries y rotaciones H-spawn en segundos.'),(160,14,'Fracture','A','Humos r?pidos y molly ejecutan A dish y B arcade sin exceso de rango.'),(161,12,'Fracture','A','Haunt y prowlers barren A dish y B site; ult limpia post-humo.'),(162,8,'Fracture','A','Darts de arcade y dish revelan anchors pese a la geometr?a torcida.'),(163,22,'Fracture','A','Ult fuerza el defuse en sitios peque?os, turret cierra B arcade.'),(164,19,'Fracture','A','Humos recargables y revive mantienen presencia en sitios peque?os.'),(165,23,'Fracture','B','Op hold en A main con tele de escape, pero el kit sufre fuera del site.'),(166,21,'Fracture','B','Tripwires en ziplines ?tiles, Killjoy saca m?s valor en sitios chicos.'),(167,15,'Fracture','B','Molly post-plant viable, Brim y Omen rinden m?s en rotaciones cortas.'),(168,17,'Pearl','S','Estrellas globales sin tele propia del mapa: controla mid y site a la vez.'),(169,23,'Pearl','S','Op hold en mid y connector, tele cubre la ausencia de rotaciones r?pidas.'),(170,12,'Pearl','S','Prowlers y haunt esenciales en mid cerrado con muchos rincones.'),(171,18,'Pearl','A','Muros de agua cubren ejecutes largos de A main y B link.'),(172,1,'Pearl','A','Dash para entries en A main y B link, updraft a pocket.'),(173,6,'Pearl','A','Slide por mid rompe Chamber y crea entries r?pidas a site.'),(174,3,'Pearl','A','Nades en dugout y B site, satchels para subir a pocket y heaven.'),(175,21,'Pearl','A','Cam en mid y trips en A dugout neutralizan flancos constantes.'),(176,24,'Pearl','A','Sensor y wall retrasan flancos por mid y ganan tiempo de rotaci?n.'),(177,19,'Pearl','B','Humos recargables ?tiles, Astra sigue siendo el controlador rey aqu?.'),(178,15,'Pearl','B','Muro en A main viable, Harbor cubre mejor las rotaciones cortas.'),(179,16,'Sunset','S','Humos globales cubren A main, mid y B market; tele a elevados clutch.'),(180,21,'Sunset','S','Cam en market y tripwires en A alley: pareja casi 100% pick en pro.'),(181,3,'Sunset','S','Boombot en A main y satchel a B market devastan el mapa corto.'),(182,14,'Sunset','A','Alcance limitado deja de ser problema: humos y molly ejecutan cualquier site.'),(183,4,'Sunset','A','Flash curve en mid y wall en A main sostienen entries repetidos.'),(184,12,'Sunset','A','Prowlers y haunt limpian mid top y B market cerrado.'),(185,1,'Sunset','A','Dash por A main y mid para Op holds con salida r?pida.'),(186,19,'Sunset','A','Humos recargables y revive alargan defensa en sitios compactos.'),(187,8,'Sunset','A','Darts de mid top y A main revelan anchors en un mid muy disputado.'),(188,22,'Sunset','B','Ult en B market s?lido, pero Cypher cubre mejor los flancos largos.'),(189,9,'Sunset','B','Faults y stuns quiebran mid, compite con Fade por el slot iniciador.'),(190,22,'Abyss','S','Turret y trampas cerca de huecos empujan enemigos al vac?o.'),(191,19,'Abyss','S','Humos recargables y revive aguantan rotaciones largu?simas.'),(192,17,'Abyss','S','Gravity well arrastra enemigos hacia el abismo; estrellas cubren todo el mapa.'),(193,1,'Abyss','A','Updraft asegura Op holds en A main y B main sin miedo al fall damage.'),(194,8,'Abyss','A','Recon bolt atraviesa los techos abiertos y cubre sitios vastos.'),(195,21,'Abyss','A','Tripwires en bordes detectan pushes y empujan al vac?o a los descuidados.'),(196,4,'Abyss','A','Wall sobre el vac?o bloquea ?ngulos y heal sostiene entradas largas.'),(197,25,'Abyss','A','Razorvine en bordes y trampas de arma cubren sitios con poca cobertura.'),(198,16,'Abyss','A','Humos r?pidos y tele agresivo sobre elevaciones frente al abismo.'),(199,9,'Abyss','B','Faults ?tiles, pero la falta de paredes completas reduce su alcance.'),(200,3,'Abyss','B','Boombot viable en bordes, pero pierde en rotaciones muy largas.');
/*!40000 ALTER TABLE `agente_mapa_meta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `amistad`
--

DROP TABLE IF EXISTS `amistad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `amistad` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `emisor_id` int(11) NOT NULL,
  `receptor_id` int(11) NOT NULL,
  `estado` enum('pendiente','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `resuelto_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_emisor_receptor` (`emisor_id`,`receptor_id`),
  KEY `FK_am_receptor` (`receptor_id`),
  CONSTRAINT `FK_am_emisor` FOREIGN KEY (`emisor_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_am_receptor` FOREIGN KEY (`receptor_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amistad`
--

LOCK TABLES `amistad` WRITE;
/*!40000 ALTER TABLE `amistad` DISABLE KEYS */;
INSERT INTO `amistad` VALUES (2,19,20,'pendiente','2026-04-18 22:08:05',NULL),(3,17,20,'pendiente','2026-04-18 16:08:05',NULL),(4,15,20,'pendiente','2026-04-18 00:08:05',NULL),(5,20,9,'pendiente','2026-04-18 21:08:05',NULL),(6,20,11,'pendiente','2026-04-18 23:38:05',NULL),(7,20,8,'aceptada','2026-04-09 00:08:05','2026-04-10 00:08:05'),(8,6,20,'aceptada','2026-04-04 00:08:05','2026-04-05 00:08:05'),(9,20,13,'aceptada','2026-04-14 00:08:05','2026-04-14 00:08:05'),(10,4,20,'aceptada','2026-03-30 00:08:05','2026-03-31 00:08:05'),(11,23,12,'pendiente','2026-05-28 00:46:22',NULL),(12,1,23,'aceptada','2026-05-28 00:48:55','2026-05-28 00:49:40');
/*!40000 ALTER TABLE `amistad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lineup`
--

DROP TABLE IF EXISTS `lineup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lineup` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `agente_id` int(11) NOT NULL,
  `mapa` enum('Ascent','Bind','Breeze','Fracture','Haven','Icebox','Lotus','Pearl','Split','Sunset','Abyss','Corrode') NOT NULL,
  `lado` varchar(20) NOT NULL DEFAULT 'Ataque',
  `habilidad` varchar(100) DEFAULT NULL,
  `inicio_x` decimal(5,2) DEFAULT NULL,
  `inicio_y` decimal(5,2) DEFAULT NULL,
  `destino_x` decimal(5,2) DEFAULT NULL,
  `destino_y` decimal(5,2) DEFAULT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `video_url` varchar(255) NOT NULL,
  `aprobado` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FK_li_usuario` (`usuario_id`),
  KEY `FK_li_agente` (`agente_id`),
  CONSTRAINT `FK_li_agente` FOREIGN KEY (`agente_id`) REFERENCES `agente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_li_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lineup`
--

LOCK TABLES `lineup` WRITE;
/*!40000 ALTER TABLE `lineup` DISABLE KEYS */;
INSERT INTO `lineup` VALUES (1,1,14,'Abyss','Ataque','Baliza estimulante',27.57,63.37,15.72,43.28,'Brimstone - Baliza estimulante en Abyss','','https://www.youtube.com/watch?v=LIa6UhjRu8g',1,'2026-05-28 16:20:03');
/*!40000 ALTER TABLE `lineup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensaje`
--

DROP TABLE IF EXISTS `mensaje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mensaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `emisor_id` int(11) NOT NULL,
  `receptor_id` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `tipo` enum('text','valorant_code','discord_link','discord_id','riot_id') NOT NULL DEFAULT 'text',
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FK_me_emisor` (`emisor_id`),
  KEY `FK_me_receptor` (`receptor_id`),
  CONSTRAINT `FK_me_emisor` FOREIGN KEY (`emisor_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_me_receptor` FOREIGN KEY (`receptor_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensaje`
--

LOCK TABLES `mensaje` WRITE;
/*!40000 ALTER TABLE `mensaje` DISABLE KEYS */;
INSERT INTO `mensaje` VALUES (8,6,20,'buena esa clutch del otro d?a','text',1,'2026-04-14 00:19:12'),(9,20,6,'jaja gracias','text',1,'2026-04-14 00:21:12'),(10,6,20,'mi discord: 392847192837182746','discord_id',1,'2026-04-18 23:19:12'),(11,20,13,'tienes c?digo?','text',1,'2026-04-18 21:19:12'),(12,13,20,'#DHX74K2','valorant_code',1,'2026-04-18 23:09:12'),(13,4,20,'no jugaste ayer','text',1,'2026-04-09 00:19:12'),(14,20,4,'estaba estudiando','text',1,'2026-04-09 00:22:12'),(15,20,13,'#DHX74K2','valorant_code',0,'2026-04-20 09:51:07'),(19,8,20,'?Hola! ?Te animas a unas rankeadas esta noche?','text',1,'2026-04-20 09:07:49'),(20,20,8,'Claro, ?a qu? hora?','text',1,'2026-04-20 09:09:49'),(21,8,20,'A las 22:30. Te paso el Discord del grupo:','text',1,'2026-04-20 09:15:49'),(22,8,20,'https://discord.gg/valorant-esp','discord_link',1,'2026-04-20 09:15:49'),(23,20,8,'Apunta mi Discord ID, te a?ado:','text',1,'2026-04-20 09:20:49'),(24,20,8,'287653219054923776','discord_id',1,'2026-04-20 09:20:49'),(25,8,20,'?Y tu Riot ID para invitarte al grupo?','text',1,'2026-04-20 09:27:49'),(26,20,8,'GoldRush#EUW','riot_id',1,'2026-04-20 09:28:49'),(27,8,20,'Perfecto. El m?o por si acaso:','text',1,'2026-04-20 09:30:49'),(28,8,20,'GoldStandard#1234','riot_id',1,'2026-04-20 09:30:49'),(29,8,20,'C?digo del grupo privado para esta noche:','text',1,'2026-04-20 09:43:49'),(30,8,20,'#VALO2026','valorant_code',1,'2026-04-20 09:43:49'),(31,20,8,'Genial. Prueba tambi?n con este si falla:','text',1,'2026-04-20 09:45:49'),(32,20,8,'VAL-GOLD-2026','valorant_code',1,'2026-04-20 09:45:49'),(33,8,20,'Nos vemos en Discord ??','text',1,'2026-04-20 09:50:49'),(34,20,8,'Entrando ya','text',0,'2026-04-20 09:53:49'),(35,20,8,'holaquetal#2343','riot_id',0,'2026-04-20 09:57:16'),(36,23,1,'hola picha','text',1,'2026-05-28 00:49:49'),(37,23,1,'dajbahbd#434','riot_id',1,'2026-05-28 00:50:04');
/*!40000 ALTER TABLE `mensaje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rango` enum('Sin clasificar','Iron 1','Iron 2','Iron 3','Bronze 1','Bronze 2','Bronze 3','Silver 1','Silver 2','Silver 3','Gold 1','Gold 2','Gold 3','Platinum 1','Platinum 2','Platinum 3','Diamond 1','Diamond 2','Diamond 3','Ascendant 1','Ascendant 2','Ascendant 3','Immortal 1','Immortal 2','Immortal 3','Radiant') NOT NULL DEFAULT 'Sin clasificar',
  `rango_rr` int(11) NOT NULL DEFAULT 0,
  `region` enum('EU','NA','LATAM','BR','AP','KR') NOT NULL DEFAULT 'EU',
  `es_admin` tinyint(1) NOT NULL DEFAULT 0,
  `riot_id` varchar(50) DEFAULT NULL,
  `riot_tag` varchar(10) DEFAULT NULL,
  `riot_region` enum('eu','na','ap','kr','latam','br') DEFAULT NULL,
  `riot_id_visible` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `ultima_actividad` datetime DEFAULT NULL,
  `estado_presencia` enum('en_linea','ausente','invisible') NOT NULL DEFAULT 'en_linea',
  `tipo_usuario` enum('real','ficticio') NOT NULL DEFAULT 'real',
  `perfil_completo` enum('si','no') NOT NULL DEFAULT 'no',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_username` (`username`),
  UNIQUE KEY `UQ_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'admin','admin@valosense.com','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Iron 1',0,'EU',1,NULL,NULL,NULL,1,'2026-04-18 17:56:05',NULL,'en_linea','ficticio','si'),(2,'iron_novato','iron_novato@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Iron 1',0,'EU',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(3,'iron_learner','iron_learner@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Iron 1',0,'NA',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(4,'bronze_climb','bronze_climb@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Bronze 1',0,'EU',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51','2026-04-18 22:19:12','en_linea','ficticio','si'),(5,'bronze_duo','bronze_duo@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Bronze 1',0,'LATAM',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(6,'silver_fox','silver_fox@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Silver 1',0,'EU',0,'SilverFox','EUW2','eu',0,'2026-04-18 18:38:51','2026-04-19 00:19:12','en_linea','ficticio','si'),(7,'silver_bullet','silver_bullet@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Silver 1',0,'NA',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(8,'gold_standard','gold_standard@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Gold 1',0,'EU',0,'GoldStandard','EUW1','eu',1,'2026-04-18 18:38:51','2026-04-19 00:19:12','en_linea','ficticio','si'),(9,'gold_rush','gold_rush@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Gold 1',0,'BR',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(10,'gold_mine','gold_mine@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Gold 1',0,'NA',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(11,'plat_seeker','plat_seeker@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Platinum 1',0,'LATAM',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(12,'plat_edge','plat_edge@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Platinum 1',0,'EU',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(13,'diamond_hands','diamond_hands@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Diamond 1',0,'EU',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51','2026-04-18 22:19:12','en_linea','ficticio','si'),(14,'diamond_pro','diamond_pro@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Diamond 1',0,'AP',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(15,'ascend_now','ascend_now@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Ascendant 1',0,'NA',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(16,'ascend_ppl','ascend_ppl@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Ascendant 1',0,'EU',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(17,'immortal_one','immortal_one@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Immortal 1',0,'BR',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(18,'immortal_clutch','immortal_clutch@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Immortal 1',0,'KR',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(19,'radiant_proof','radiant_proof@test.valosense','$2y$10$gkcfJKk5/xNfaX8Qf67SNOqKvEX.OOl6AtljZrWrcY1pBSaioq/ei','Radiant',0,'EU',0,NULL,NULL,NULL,1,'2026-04-18 18:38:51',NULL,'en_linea','ficticio','si'),(20,'user','user@valosense.local','$2y$10$qZyu14m1myy2m1jmcu70buooEGSY6OoNDE8hpUBgEy2eOrAS5Mh3K','Gold 1',0,'EU',0,NULL,NULL,NULL,1,'2026-04-19 00:02:58','2026-04-20 11:04:17','en_linea','ficticio','si'),(21,'david','david@gmail.com','$2b$10$mrJTXRelSXFr.b0s4Sqz9.Rgr/he1PTBt88h.5Z1SCyq7gv8jFSnC','Iron 1',0,'EU',1,NULL,NULL,NULL,1,'2026-05-26 00:00:00',NULL,'en_linea','ficticio','si'),(23,'david24','david24@gmail.com','$2y$10$wjtyNK.dp539Mij5M1eTTOF8M2yIn.s5lc4YhFHguTxXTdFsIGSby','Silver 3',33,'EU',0,'David24','#8916','eu',1,'2026-05-27 19:51:17',NULL,'en_linea','real','si');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'valosensebdd'
--

--
-- Dumping routines for database 'valosensebdd'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-28 18:48:03
