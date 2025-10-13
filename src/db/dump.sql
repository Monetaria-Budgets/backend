-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: monetaria
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `blacklisted_tokens`
--

DROP TABLE IF EXISTS `blacklisted_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blacklisted_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`(255)),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blacklisted_tokens`
--

LOCK TABLES `blacklisted_tokens` WRITE;
/*!40000 ALTER TABLE `blacklisted_tokens` DISABLE KEYS */;
INSERT INTO `blacklisted_tokens` VALUES (1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI2LCJsb2dpbiI6InhlbjFuIiwiaWF0IjoxNzYwMzIyMTA4LCJleHAiOjE3NjA5MjY5MDh9.N_5avjyTkhEOVFaSdd4Vxxr_uOPo1AIj18Ra6AhSqg0','2025-10-20 15:42:15','2025-10-13 08:42:15');
/*!40000 ALTER TABLE `blacklisted_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_category` (`user_id`,`name`),
  CONSTRAINT `category_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=343 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,1,'Другое','2025-10-03 14:47:23'),(2,1,'Коммунальные услуги','2025-10-03 14:47:23'),(3,1,'Техника','2025-10-03 14:47:23'),(4,1,'Путешествия','2025-10-03 14:47:23'),(5,1,'Подарки','2025-10-03 14:47:23'),(6,1,'Образование','2025-10-03 14:47:23'),(7,1,'Здоровье и аптека','2025-10-03 14:47:23'),(8,1,'Одежда и обувь','2025-10-03 14:47:23'),(9,1,'Развлечения','2025-10-03 14:47:23'),(10,1,'Интернет и связь','2025-10-03 14:47:23'),(11,1,'ЖКХ','2025-10-03 14:47:23'),(12,1,'Такси','2025-10-03 14:47:23'),(13,1,'Транспорт','2025-10-03 14:47:23'),(14,1,'Кафе и рестораны','2025-10-03 14:47:23'),(15,1,'Еда','2025-10-03 14:47:23'),(16,1,'Подработка','2025-10-03 14:47:23'),(17,1,'Премия','2025-10-03 14:47:23'),(18,1,'Зарплата','2025-10-03 14:47:23'),(19,2,'Другое','2025-10-03 14:47:23'),(20,2,'Коммунальные услуги','2025-10-03 14:47:23'),(21,2,'Техника','2025-10-03 14:47:23'),(22,2,'Путешествия','2025-10-03 14:47:23'),(23,2,'Подарки','2025-10-03 14:47:23'),(24,2,'Образование','2025-10-03 14:47:23'),(25,2,'Здоровье и аптека','2025-10-03 14:47:23'),(26,2,'Одежда и обувь','2025-10-03 14:47:23'),(27,2,'Развлечения','2025-10-03 14:47:23'),(28,2,'Интернет и связь','2025-10-03 14:47:23'),(29,2,'ЖКХ','2025-10-03 14:47:23'),(30,2,'Такси','2025-10-03 14:47:23'),(31,2,'Транспорт','2025-10-03 14:47:23'),(32,2,'Кафе и рестораны','2025-10-03 14:47:23'),(33,2,'Еда','2025-10-03 14:47:23'),(34,2,'Подработка','2025-10-03 14:47:23'),(35,2,'Премия','2025-10-03 14:47:23'),(36,2,'Зарплата','2025-10-03 14:47:23'),(37,3,'Другое','2025-10-03 14:47:23'),(38,3,'Коммунальные услуги','2025-10-03 14:47:23'),(39,3,'Техника','2025-10-03 14:47:23'),(40,3,'Путешествия','2025-10-03 14:47:23'),(41,3,'Подарки','2025-10-03 14:47:23'),(42,3,'Образование','2025-10-03 14:47:23'),(43,3,'Здоровье и аптека','2025-10-03 14:47:23'),(44,3,'Одежда и обувь','2025-10-03 14:47:23'),(45,3,'Развлечения','2025-10-03 14:47:23'),(46,3,'Интернет и связь','2025-10-03 14:47:23'),(47,3,'ЖКХ','2025-10-03 14:47:23'),(48,3,'Такси','2025-10-03 14:47:23'),(49,3,'Транспорт','2025-10-03 14:47:23'),(50,3,'Кафе и рестораны','2025-10-03 14:47:23'),(51,3,'Еда','2025-10-03 14:47:23'),(52,3,'Подработка','2025-10-03 14:47:23'),(53,3,'Премия','2025-10-03 14:47:23'),(54,3,'Зарплата','2025-10-03 14:47:23'),(55,4,'Другое','2025-10-03 14:47:23'),(56,4,'Коммунальные услуги','2025-10-03 14:47:23'),(57,4,'Техника','2025-10-03 14:47:23'),(58,4,'Путешествия','2025-10-03 14:47:23'),(59,4,'Подарки','2025-10-03 14:47:23'),(60,4,'Образование','2025-10-03 14:47:23'),(61,4,'Здоровье и аптека','2025-10-03 14:47:23'),(62,4,'Одежда и обувь','2025-10-03 14:47:23'),(63,4,'Развлечения','2025-10-03 14:47:23'),(64,4,'Интернет и связь','2025-10-03 14:47:23'),(65,4,'ЖКХ','2025-10-03 14:47:23'),(66,4,'Такси','2025-10-03 14:47:23'),(67,4,'Транспорт','2025-10-03 14:47:23'),(68,4,'Кафе и рестораны','2025-10-03 14:47:23'),(69,4,'Еда','2025-10-03 14:47:23'),(70,4,'Подработка','2025-10-03 14:47:23'),(71,4,'Премия','2025-10-03 14:47:23'),(72,4,'Зарплата','2025-10-03 14:47:23'),(73,5,'Другое','2025-10-03 14:47:23'),(74,5,'Коммунальные услуги','2025-10-03 14:47:23'),(75,5,'Техника','2025-10-03 14:47:23'),(76,5,'Путешествия','2025-10-03 14:47:23'),(77,5,'Подарки','2025-10-03 14:47:23'),(78,5,'Образование','2025-10-03 14:47:23'),(79,5,'Здоровье и аптека','2025-10-03 14:47:23'),(80,5,'Одежда и обувь','2025-10-03 14:47:23'),(81,5,'Развлечения','2025-10-03 14:47:23'),(82,5,'Интернет и связь','2025-10-03 14:47:23'),(83,5,'ЖКХ','2025-10-03 14:47:23'),(84,5,'Такси','2025-10-03 14:47:23'),(85,5,'Транспорт','2025-10-03 14:47:23'),(86,5,'Кафе и рестораны','2025-10-03 14:47:23'),(87,5,'Еда','2025-10-03 14:47:23'),(88,5,'Подработка','2025-10-03 14:47:23'),(89,5,'Премия','2025-10-03 14:47:23'),(90,5,'Зарплата','2025-10-03 14:47:23'),(91,6,'Другое','2025-10-03 14:47:23'),(92,6,'Коммунальные услуги','2025-10-03 14:47:23'),(93,6,'Техника','2025-10-03 14:47:23'),(94,6,'Путешествия','2025-10-03 14:47:23'),(95,6,'Подарки','2025-10-03 14:47:23'),(96,6,'Образование','2025-10-03 14:47:23'),(97,6,'Здоровье и аптека','2025-10-03 14:47:23'),(98,6,'Одежда и обувь','2025-10-03 14:47:23'),(99,6,'Развлечения','2025-10-03 14:47:23'),(100,6,'Интернет и связь','2025-10-03 14:47:23'),(101,6,'ЖКХ','2025-10-03 14:47:23'),(102,6,'Такси','2025-10-03 14:47:23'),(103,6,'Транспорт','2025-10-03 14:47:23'),(104,6,'Кафе и рестораны','2025-10-03 14:47:23'),(105,6,'Еда','2025-10-03 14:47:23'),(106,6,'Подработка','2025-10-03 14:47:23'),(107,6,'Премия','2025-10-03 14:47:23'),(108,6,'Зарплата','2025-10-03 14:47:23'),(109,7,'Другое','2025-10-03 14:47:23'),(110,7,'Коммунальные услуги','2025-10-03 14:47:23'),(111,7,'Техника','2025-10-03 14:47:23'),(112,7,'Путешествия','2025-10-03 14:47:23'),(113,7,'Подарки','2025-10-03 14:47:23'),(114,7,'Образование','2025-10-03 14:47:23'),(115,7,'Здоровье и аптека','2025-10-03 14:47:23'),(116,7,'Одежда и обувь','2025-10-03 14:47:23'),(117,7,'Развлечения','2025-10-03 14:47:23'),(118,7,'Интернет и связь','2025-10-03 14:47:23'),(119,7,'ЖКХ','2025-10-03 14:47:23'),(120,7,'Такси','2025-10-03 14:47:23'),(121,7,'Транспорт','2025-10-03 14:47:23'),(122,7,'Кафе и рестораны','2025-10-03 14:47:23'),(123,7,'Еда','2025-10-03 14:47:23'),(124,7,'Подработка','2025-10-03 14:47:23'),(125,7,'Премия','2025-10-03 14:47:23'),(126,7,'Зарплата','2025-10-03 14:47:23'),(127,8,'Другое','2025-10-03 14:47:23'),(128,8,'Коммунальные услуги','2025-10-03 14:47:23'),(129,8,'Техника','2025-10-03 14:47:23'),(130,8,'Путешествия','2025-10-03 14:47:23'),(131,8,'Подарки','2025-10-03 14:47:23'),(132,8,'Образование','2025-10-03 14:47:23'),(133,8,'Здоровье и аптека','2025-10-03 14:47:23'),(134,8,'Одежда и обувь','2025-10-03 14:47:23'),(135,8,'Развлечения','2025-10-03 14:47:23'),(136,8,'Интернет и связь','2025-10-03 14:47:23'),(137,8,'ЖКХ','2025-10-03 14:47:23'),(138,8,'Такси','2025-10-03 14:47:23'),(139,8,'Транспорт','2025-10-03 14:47:23'),(140,8,'Кафе и рестораны','2025-10-03 14:47:23'),(141,8,'Еда','2025-10-03 14:47:23'),(142,8,'Подработка','2025-10-03 14:47:23'),(143,8,'Премия','2025-10-03 14:47:23'),(144,8,'Зарплата','2025-10-03 14:47:23'),(145,9,'Другое','2025-10-03 14:47:23'),(146,9,'Коммунальные услуги','2025-10-03 14:47:23'),(147,9,'Техника','2025-10-03 14:47:23'),(148,9,'Путешествия','2025-10-03 14:47:23'),(149,9,'Подарки','2025-10-03 14:47:23'),(150,9,'Образование','2025-10-03 14:47:23'),(151,9,'Здоровье и аптека','2025-10-03 14:47:23'),(152,9,'Одежда и обувь','2025-10-03 14:47:23'),(153,9,'Развлечения','2025-10-03 14:47:23'),(154,9,'Интернет и связь','2025-10-03 14:47:23'),(155,9,'ЖКХ','2025-10-03 14:47:23'),(156,9,'Такси','2025-10-03 14:47:23'),(157,9,'Транспорт','2025-10-03 14:47:23'),(158,9,'Кафе и рестораны','2025-10-03 14:47:23'),(159,9,'Еда','2025-10-03 14:47:23'),(160,9,'Подработка','2025-10-03 14:47:23'),(161,9,'Премия','2025-10-03 14:47:23'),(162,9,'Зарплата','2025-10-03 14:47:23'),(163,10,'Другое','2025-10-03 14:47:23'),(164,10,'Коммунальные услуги','2025-10-03 14:47:23'),(165,10,'Техника','2025-10-03 14:47:23'),(166,10,'Путешествия','2025-10-03 14:47:23'),(167,10,'Подарки','2025-10-03 14:47:23'),(168,10,'Образование','2025-10-03 14:47:23'),(169,10,'Здоровье и аптека','2025-10-03 14:47:23'),(170,10,'Одежда и обувь','2025-10-03 14:47:23'),(171,10,'Развлечения','2025-10-03 14:47:23'),(172,10,'Интернет и связь','2025-10-03 14:47:23'),(173,10,'ЖКХ','2025-10-03 14:47:23'),(174,10,'Такси','2025-10-03 14:47:23'),(175,10,'Транспорт','2025-10-03 14:47:23'),(176,10,'Кафе и рестораны','2025-10-03 14:47:23'),(177,10,'Еда','2025-10-03 14:47:23'),(178,10,'Подработка','2025-10-03 14:47:23'),(179,10,'Премия','2025-10-03 14:47:23'),(180,10,'Зарплата','2025-10-03 14:47:23'),(181,11,'Другое','2025-10-03 14:47:23'),(182,11,'Коммунальные услуги','2025-10-03 14:47:23'),(183,11,'Техника','2025-10-03 14:47:23'),(184,11,'Путешествия','2025-10-03 14:47:23'),(185,11,'Подарки','2025-10-03 14:47:23'),(186,11,'Образование','2025-10-03 14:47:23'),(187,11,'Здоровье и аптека','2025-10-03 14:47:23'),(188,11,'Одежда и обувь','2025-10-03 14:47:23'),(189,11,'Развлечения','2025-10-03 14:47:23'),(190,11,'Интернет и связь','2025-10-03 14:47:23'),(191,11,'ЖКХ','2025-10-03 14:47:23'),(192,11,'Такси','2025-10-03 14:47:23'),(193,11,'Транспорт','2025-10-03 14:47:23'),(194,11,'Кафе и рестораны','2025-10-03 14:47:23'),(195,11,'Еда','2025-10-03 14:47:23'),(196,11,'Подработка','2025-10-03 14:47:23'),(197,11,'Премия','2025-10-03 14:47:23'),(198,11,'Зарплата','2025-10-03 14:47:23'),(199,12,'Другое','2025-10-03 14:47:23'),(200,12,'Коммунальные услуги','2025-10-03 14:47:23'),(201,12,'Техника','2025-10-03 14:47:23'),(202,12,'Путешествия','2025-10-03 14:47:23'),(203,12,'Подарки','2025-10-03 14:47:23'),(204,12,'Образование','2025-10-03 14:47:23'),(205,12,'Здоровье и аптека','2025-10-03 14:47:23'),(206,12,'Одежда и обувь','2025-10-03 14:47:23'),(207,12,'Развлечения','2025-10-03 14:47:23'),(208,12,'Интернет и связь','2025-10-03 14:47:23'),(209,12,'ЖКХ','2025-10-03 14:47:23'),(210,12,'Такси','2025-10-03 14:47:23'),(211,12,'Транспорт','2025-10-03 14:47:23'),(212,12,'Кафе и рестораны','2025-10-03 14:47:23'),(213,12,'Еда','2025-10-03 14:47:23'),(214,12,'Подработка','2025-10-03 14:47:23'),(215,12,'Премия','2025-10-03 14:47:23'),(216,12,'Зарплата','2025-10-03 14:47:23'),(217,13,'Другое','2025-10-03 14:47:23'),(218,13,'Коммунальные услуги','2025-10-03 14:47:23'),(219,13,'Техника','2025-10-03 14:47:23'),(220,13,'Путешествия','2025-10-03 14:47:23'),(221,13,'Подарки','2025-10-03 14:47:23'),(222,13,'Образование','2025-10-03 14:47:23'),(223,13,'Здоровье и аптека','2025-10-03 14:47:23'),(224,13,'Одежда и обувь','2025-10-03 14:47:23'),(225,13,'Развлечения','2025-10-03 14:47:23'),(226,13,'Интернет и связь','2025-10-03 14:47:23'),(227,13,'ЖКХ','2025-10-03 14:47:23'),(228,13,'Такси','2025-10-03 14:47:23'),(229,13,'Транспорт','2025-10-03 14:47:23'),(230,13,'Кафе и рестораны','2025-10-03 14:47:23'),(231,13,'Еда','2025-10-03 14:47:23'),(232,13,'Подработка','2025-10-03 14:47:23'),(233,13,'Премия','2025-10-03 14:47:23'),(234,13,'Зарплата','2025-10-03 14:47:23'),(235,14,'Другое','2025-10-03 14:47:23'),(236,14,'Коммунальные услуги','2025-10-03 14:47:23'),(237,14,'Техника','2025-10-03 14:47:23'),(238,14,'Путешествия','2025-10-03 14:47:23'),(239,14,'Подарки','2025-10-03 14:47:23'),(240,14,'Образование','2025-10-03 14:47:23'),(241,14,'Здоровье и аптека','2025-10-03 14:47:23'),(242,14,'Одежда и обувь','2025-10-03 14:47:23'),(243,14,'Развлечения','2025-10-03 14:47:23'),(244,14,'Интернет и связь','2025-10-03 14:47:23'),(245,14,'ЖКХ','2025-10-03 14:47:23'),(246,14,'Такси','2025-10-03 14:47:23'),(247,14,'Транспорт','2025-10-03 14:47:23'),(248,14,'Кафе и рестораны','2025-10-03 14:47:23'),(249,14,'Еда','2025-10-03 14:47:23'),(250,14,'Подработка','2025-10-03 14:47:23'),(251,14,'Премия','2025-10-03 14:47:23'),(252,14,'Зарплата','2025-10-03 14:47:23'),(253,15,'Другое','2025-10-03 14:47:23'),(254,15,'Коммунальные услуги','2025-10-03 14:47:23'),(255,15,'Техника','2025-10-03 14:47:23'),(256,15,'Путешествия','2025-10-03 14:47:23'),(257,15,'Подарки','2025-10-03 14:47:23'),(258,15,'Образование','2025-10-03 14:47:23'),(259,15,'Здоровье и аптека','2025-10-03 14:47:23'),(260,15,'Одежда и обувь','2025-10-03 14:47:23'),(261,15,'Развлечения','2025-10-03 14:47:23'),(262,15,'Интернет и связь','2025-10-03 14:47:23'),(263,15,'ЖКХ','2025-10-03 14:47:23'),(264,15,'Такси','2025-10-03 14:47:23'),(265,15,'Транспорт','2025-10-03 14:47:23'),(266,15,'Кафе и рестораны','2025-10-03 14:47:23'),(267,15,'Еда','2025-10-03 14:47:23'),(268,15,'Подработка','2025-10-03 14:47:23'),(269,15,'Премия','2025-10-03 14:47:23'),(270,15,'Зарплата','2025-10-03 14:47:23'),(271,16,'Другое','2025-10-03 14:47:23'),(272,16,'Коммунальные услуги','2025-10-03 14:47:23'),(273,16,'Техника','2025-10-03 14:47:23'),(274,16,'Путешествия','2025-10-03 14:47:23'),(275,16,'Подарки','2025-10-03 14:47:23'),(276,16,'Образование','2025-10-03 14:47:23'),(277,16,'Здоровье и аптека','2025-10-03 14:47:23'),(278,16,'Одежда и обувь','2025-10-03 14:47:23'),(279,16,'Развлечения','2025-10-03 14:47:23'),(280,16,'Интернет и связь','2025-10-03 14:47:23'),(281,16,'ЖКХ','2025-10-03 14:47:23'),(282,16,'Такси','2025-10-03 14:47:23'),(283,16,'Транспорт','2025-10-03 14:47:23'),(284,16,'Кафе и рестораны','2025-10-03 14:47:23'),(285,16,'Еда','2025-10-03 14:47:23'),(286,16,'Подработка','2025-10-03 14:47:23'),(287,16,'Премия','2025-10-03 14:47:23'),(288,16,'Зарплата','2025-10-03 14:47:23'),(289,17,'Другое','2025-10-03 14:47:23'),(290,17,'Коммунальные услуги','2025-10-03 14:47:23'),(291,17,'Техника','2025-10-03 14:47:23'),(292,17,'Путешествия','2025-10-03 14:47:23'),(293,17,'Подарки','2025-10-03 14:47:23'),(294,17,'Образование','2025-10-03 14:47:23'),(295,17,'Здоровье и аптека','2025-10-03 14:47:23'),(296,17,'Одежда и обувь','2025-10-03 14:47:23'),(297,17,'Развлечения','2025-10-03 14:47:23'),(298,17,'Интернет и связь','2025-10-03 14:47:23'),(299,17,'ЖКХ','2025-10-03 14:47:23'),(300,17,'Такси','2025-10-03 14:47:23'),(301,17,'Транспорт','2025-10-03 14:47:23'),(302,17,'Кафе и рестораны','2025-10-03 14:47:23'),(303,17,'Еда','2025-10-03 14:47:23'),(304,17,'Подработка','2025-10-03 14:47:23'),(305,17,'Премия','2025-10-03 14:47:23'),(306,17,'Зарплата','2025-10-03 14:47:23'),(307,18,'Другое','2025-10-03 14:47:23'),(308,18,'Коммунальные услуги','2025-10-03 14:47:23'),(309,18,'Техника','2025-10-03 14:47:23'),(310,18,'Путешествия','2025-10-03 14:47:23'),(311,18,'Подарки','2025-10-03 14:47:23'),(312,18,'Образование','2025-10-03 14:47:23'),(313,18,'Здоровье и аптека','2025-10-03 14:47:23'),(314,18,'Одежда и обувь','2025-10-03 14:47:23'),(315,18,'Развлечения','2025-10-03 14:47:23'),(316,18,'Интернет и связь','2025-10-03 14:47:23'),(317,18,'ЖКХ','2025-10-03 14:47:23'),(318,18,'Такси','2025-10-03 14:47:23'),(319,18,'Транспорт','2025-10-03 14:47:23'),(320,18,'Кафе и рестораны','2025-10-03 14:47:23'),(321,18,'Еда','2025-10-03 14:47:23'),(322,18,'Подработка','2025-10-03 14:47:23'),(323,18,'Премия','2025-10-03 14:47:23'),(324,18,'Зарплата','2025-10-03 14:47:23'),(325,19,'Другое','2025-10-03 14:47:23'),(326,19,'Коммунальные услуги','2025-10-03 14:47:23'),(327,19,'Техника','2025-10-03 14:47:23'),(328,19,'Путешествия','2025-10-03 14:47:23'),(329,19,'Подарки','2025-10-03 14:47:23'),(330,19,'Образование','2025-10-03 14:47:23'),(331,19,'Здоровье и аптека','2025-10-03 14:47:23'),(332,19,'Одежда и обувь','2025-10-03 14:47:23'),(333,19,'Развлечения','2025-10-03 14:47:23'),(334,19,'Интернет и связь','2025-10-03 14:47:23'),(335,19,'ЖКХ','2025-10-03 14:47:23'),(336,19,'Такси','2025-10-03 14:47:23'),(337,19,'Транспорт','2025-10-03 14:47:23'),(338,19,'Кафе и рестораны','2025-10-03 14:47:23'),(339,19,'Еда','2025-10-03 14:47:23'),(340,19,'Подработка','2025-10-03 14:47:23'),(341,19,'Премия','2025-10-03 14:47:23'),(342,19,'Зарплата','2025-10-03 14:47:23');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colorscheme`
--

DROP TABLE IF EXISTS `colorscheme`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colorscheme` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `color` varchar(7) NOT NULL,
  `theme` enum('light','dark') NOT NULL DEFAULT 'light',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_theme_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colorscheme`
--

LOCK TABLES `colorscheme` WRITE;
/*!40000 ALTER TABLE `colorscheme` DISABLE KEYS */;
INSERT INTO `colorscheme` VALUES (1,'Светлая','#4A90E2','light','2025-10-03 14:47:23'),(2,'Тёмная','#8A2BE2','dark','2025-10-03 14:47:23');
/*!40000 ALTER TABLE `colorscheme` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency`
--

DROP TABLE IF EXISTS `currency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` char(3) NOT NULL,
  `name` varchar(50) NOT NULL,
  `symbol` varchar(10) NOT NULL,
  `icon_url` varchar(255) DEFAULT NULL,
  `is_crypto` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency`
--

LOCK TABLES `currency` WRITE;
/*!40000 ALTER TABLE `currency` DISABLE KEYS */;
INSERT INTO `currency` VALUES (1,'RUB','Российский рубль','₽',NULL,0);
/*!40000 ALTER TABLE `currency` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type_id` int NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `source` enum('email','push') NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_unread` (`user_id`,`is_read`),
  KEY `idx_type` (`type_id`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `notificationtype` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (1,1,1,'Ваша подписка истекает через 3 дня!',0,'email','2025-10-03 14:47:23'),(2,1,2,'Новое обновление приложения доступно.',0,'push','2025-10-03 14:47:23'),(3,2,3,'Вы превысили лимит по категории \"Еда\" на 15%.',0,'email','2025-10-03 14:47:23'),(4,3,4,'Поздравляем с днём рождения! Получите скидку 10%.',0,'push','2025-10-03 14:47:23');
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificationtype`
--

DROP TABLE IF EXISTS `notificationtype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificationtype` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificationtype`
--

LOCK TABLES `notificationtype` WRITE;
/*!40000 ALTER TABLE `notificationtype` DISABLE KEYS */;
INSERT INTO `notificationtype` VALUES (3,'budget_exceeded'),(4,'promo'),(1,'subscription_expiring'),(2,'system_update');
/*!40000 ALTER TABLE `notificationtype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operation`
--

DROP TABLE IF EXISTS `operation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `operation_type_id` int NOT NULL,
  `description` text,
  `amount` decimal(13,2) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `operation_type_id` (`operation_type_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category` (`category_id`),
  CONSTRAINT `operation_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `operation_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE,
  CONSTRAINT `operation_ibfk_3` FOREIGN KEY (`operation_type_id`) REFERENCES `operationtype` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operation`
--

LOCK TABLES `operation` WRITE;
/*!40000 ALTER TABLE `operation` DISABLE KEYS */;
INSERT INTO `operation` VALUES (1,1,18,1,'Зарплата за март',65000.00,'2025-03-05 10:00:00'),(2,1,15,2,'Продукты в магазине',1250.50,'2025-03-06 18:30:00'),(3,1,13,2,'Проездной на месяц',2500.00,'2025-03-01 09:15:00'),(4,1,10,2,'Оплата интернета',800.00,'2025-03-10 14:20:00'),(5,1,14,2,'Обед в кафе',650.00,'2025-03-12 13:00:00'),(6,1,7,2,'Лекарства от простуды',420.75,'2025-03-15 17:45:00'),(7,1,9,2,'Кино с друзьями',950.00,'2025-03-18 20:00:00'),(8,1,1,2,'Ручка и блокнот',150.00,'2025-03-09 12:00:00'),(9,2,36,1,'Зарплата',82000.00,'2025-03-05 11:00:00'),(10,2,34,1,'Фриланс проект',15000.00,'2025-03-10 16:30:00'),(11,2,33,2,'Супермаркет',2100.00,'2025-03-07 19:00:00'),(12,2,30,2,'Поездка на такси',320.50,'2025-03-08 22:10:00'),(13,2,26,2,'Новые кроссовки',5500.00,'2025-03-14 15:30:00'),(14,2,29,2,'Электричество',1200.00,'2025-03-03 10:00:00'),(15,2,22,2,'Билеты на поезд',3800.00,'2025-03-20 08:00:00'),(16,2,32,2,'Кофе навынос',220.00,'2025-03-11 09:30:00'),(17,3,54,1,'Зарплата',58000.00,'2025-03-06 09:30:00'),(18,3,51,2,'Булочная и молоко',320.00,'2025-03-06 08:15:00'),(19,3,49,2,'Метро',60.00,'2025-03-07 08:00:00'),(20,3,50,2,'Кофе на вынос',180.00,'2025-03-07 09:00:00'),(21,3,42,2,'Онлайн-курс по SQL',2999.99,'2025-03-11 20:00:00'),(22,3,45,2,'Концерт',2500.00,'2025-03-16 19:00:00'),(23,3,41,2,'Цветы маме',750.00,'2025-03-08 12:00:00'),(24,3,51,2,'Шоколадка',85.00,'2025-03-13 17:00:00'),(25,4,72,1,'Зарплата',75000.00,'2025-03-05 10:00:00'),(26,4,71,1,'Годовая премия',30000.00,'2025-03-01 14:00:00'),(27,5,90,1,'Зарплата',60000.00,'2025-03-07 10:00:00'),(28,6,108,1,'Зарплата',95000.00,'2025-03-05 10:00:00'),(29,10,174,2,'Такси после дождя',380.00,'2025-03-20 23:00:00');
/*!40000 ALTER TABLE `operation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operationtype`
--

DROP TABLE IF EXISTS `operationtype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operationtype` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operationtype`
--

LOCK TABLES `operationtype` WRITE;
/*!40000 ALTER TABLE `operationtype` DISABLE KEYS */;
INSERT INTO `operationtype` VALUES (1,'Доход'),(2,'Расход');
/*!40000 ALTER TABLE `operationtype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `premiumuser`
--

DROP TABLE IF EXISTS `premiumuser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `premiumuser` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subscription_end` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_premium_user` (`user_id`),
  CONSTRAINT `premiumuser_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `premiumuser`
--

LOCK TABLES `premiumuser` WRITE;
/*!40000 ALTER TABLE `premiumuser` DISABLE KEYS */;
INSERT INTO `premiumuser` VALUES (2,1,'2025-10-03 15:07:07','2025-10-03 15:05:07');
/*!40000 ALTER TABLE `premiumuser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  CONSTRAINT `chk_role_name` CHECK ((`name` in (_utf8mb4'User',_utf8mb4'Admin')))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (2,'Admin'),(1,'User');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spendinglimit`
--

DROP TABLE IF EXISTS `spendinglimit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spendinglimit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `amount` decimal(13,2) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_limit_user_category` (`user_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `spendinglimit_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spendinglimit_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spendinglimit`
--

LOCK TABLES `spendinglimit` WRITE;
/*!40000 ALTER TABLE `spendinglimit` DISABLE KEYS */;
/*!40000 ALTER TABLE `spendinglimit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL DEFAULT '1',
  `login` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `is_premium` tinyint(1) DEFAULT '0',
  `currency_id` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `ColorScheme_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login` (`login`),
  UNIQUE KEY `email` (`email`),
  KEY `ColorScheme_id` (`ColorScheme_id`),
  KEY `idx_login` (`login`),
  KEY `idx_email` (`email`),
  KEY `user_ibfk_1` (`role_id`),
  KEY `user_ibfk_2` (`currency_id`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `user_ibfk_2` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `user_ibfk_3` FOREIGN KEY (`ColorScheme_id`) REFERENCES `colorscheme` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,1,'ivanov','ivanov','$2b$10$7QL7msIxhdfEZPSipoKP1u/z.hvowGlk.3/JlDOeQ1rJDh9kLMLjK','ivanov@example.com',0,1,'2025-10-03 14:47:23',NULL),(2,1,'petrov','petrov','$2b$10$TzkdLFY1ftvyq9WcGMy6yeKRsYzVVJ4IxNJ8pxXXc24FZkg76jtAe','petrov@example.com',0,1,'2025-10-03 14:47:23',NULL),(3,1,'sidorov','sidorov','$2b$10$fEbjuUN/FgrsjrW0SrQy6uGXhRTMepRwB2eKLxeIkeO6YAfdKepDC','sidorov@example.com',0,1,'2025-10-03 14:47:23',NULL),(4,1,'kuznetsova','kuznetsova','$2b$10$wb9FT6cbRTX5pClgLVozaO38lV3vxlcL3fETBnKcUaqtkeDvll5iq','kuznetsova@example.com',0,1,'2025-10-03 14:47:23',NULL),(5,1,'smirnov','smirnov','$2b$10$Tj9gebZ9zzpxnwegoYPscuvdTzENR5CIZXWw6ozdGPFTR3JiWO//W','smirnov@example.com',0,1,'2025-10-03 14:47:23',NULL),(6,1,'vasilieva','vasilieva','$2b$10$yd1DK8lxRKTXSTLVg2Ic5eFupkCW3Tyt5jfxKes19YzjBwo4uePNe','vasilieva@example.com',0,1,'2025-10-03 14:47:23',NULL),(7,1,'popov','popov','$2b$10$MWKmNAS5bohMrYMJq19ugus3MX/lIAKa/x46n5IzsXtRF0y1YQSjG','popov@example.com',0,1,'2025-10-03 14:47:23',NULL),(8,1,'morozova','morozova','$2b$10$On4x7lEW30NAkbfPnH6DYupaPTceJMANnV630wF19A/rhCCFM1c5G','morozova@example.com',0,1,'2025-10-03 14:47:23',NULL),(9,1,'volkov','volkov','$2b$10$.QDQENbIyZGRsomqkVt30Oaq5PcWzESLa1/v.gS9jS2n1PPUZce9O','volkov@example.com',0,1,'2025-10-03 14:47:23',NULL),(10,1,'alekseev','alekseev','$2b$10$tnm3uukLRFGoLuzLkQxFWuX8D26T98ehd53lRw6/RTYJBXEckyEZK','alekseev@example.com',0,1,'2025-10-03 14:47:23',NULL),(11,1,'sokolov','sokolov','$2b$10$DAgO4owdrlcKIFazu1wHNuGmlh3YazZ01GpyVaJuk3ZaJOobjkLQq','sokolov@example.com',0,1,'2025-10-03 14:47:23',NULL),(12,1,'lebedev','lebedev','$2b$10$MNOnPmnXyb6wlCwVUr6UyOcLtHr1V34wOJCFC2s2WKEdOBQR9zQ1a','lebedev@example.com',0,1,'2025-10-03 14:47:23',NULL),(13,1,'kozlov','kozlov','$2b$10$VRaQQsqinJQm2S1T/RriQ.Ooz.o.2KYnZVQkF.JQ3MZIXEK7JeXCG','kozlov@example.com',0,1,'2025-10-03 14:47:23',NULL),(14,1,'novikov','novikov','$2b$10$G7UXWCOQq.DMSk7z.GT1NO.o0uzR283yuF9/4w4wi5TB8JrW6GFo.','novikov@example.com',0,1,'2025-10-03 14:47:23',NULL),(15,1,'mikhailov','mikhailov','$2b$10$PDy90slDgK9l30jz/g0Qe.4mR5ADu13NiXhCjWlnrDIgoE42uLiNS','mikhailov@example.com',0,1,'2025-10-03 14:47:23',NULL),(16,1,'orlova','orlova','$2b$10$OtPGmt.ZOYg5tds2WpePzOOvTe/PeEBgHyi54PaI8w0Oa.B9H4yFG','orlova@example.com',0,1,'2025-10-03 14:47:23',NULL),(17,1,'golubev','golubev','$2b$10$VuL52ncuh.JSzQgNSVOTzOBz5I3XS.qPI2Wrwo/EkZ.oHKOOaz.Uq','golubev@example.com',0,1,'2025-10-03 14:47:23',NULL),(18,1,'vinogradov','vinogradov','$2b$10$7kh2aTkUaPGhN388rFDmSexjF6J3vh1mj.NBbQYwA1NwzuBmny.g.','vinogradov@example.com',0,1,'2025-10-03 14:47:23',NULL),(19,1,'belov','belov','$2b$10$PhMCot/xopEQGPJK0grJF.jJSGzNu5844GWaHTFu2Ww2it4WZrynu','belov@example.com',0,1,'2025-10-03 14:47:23',NULL),(20,2,'admin','admin','$2b$10$s5HjKCrYOsjCHfg1rqAL1.QogdViEjIshdx6nHTl8CQR3WA8j7hGy','admin@finapp.com',0,1,'2025-10-03 14:47:23',NULL),(21,1,'1','1','$2b$10$WninkxEbNIgkuTm8GWo8ieUaSkIQW/o.QWW979nttSqYtu5ScKuTK','testpassword123',0,1,'2025-10-08 10:10:27',NULL),(22,1,'testuser123','testuser123','$2b$10$h4gdXI72bGRG7oBd5SJqGeP.XaeoirbzIF.7BOlFdbNwazVvXSRz6','testuser123@example.com',0,1,'2025-10-08 10:11:09',NULL),(24,1,'engelzzzzzz','engelzzzzzz','$2b$10$jv6R99T0xli6KFpIOdIuhOcWSExLCKaQbh5eoqsrnVSETlvpqCGei','ldldprpre@mail.ru',0,1,'2025-10-13 01:46:27',NULL),(25,1,'engelzz','engelzz','$2b$10$tFGvHwlG2yopgx3DwdGHm.4mxfT0p5Cw4JL6L0ghNqnrrrwhrleIK','ldldprpr@mail.ru',0,1,'2025-10-13 01:46:35',NULL),(26,1,'xen1n','xen1n','$2b$10$wE8CJvc2imdugnx939xUfeMleWeAFKRSVFufO7W6O57l59siCEhFO','qwerty@mail.ru',0,1,'2025-10-13 01:56:47',NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-13 17:25:42
