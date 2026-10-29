

# 🎬 RAW OTT Platform

### Rays And Waves — Your Entertainment, Your Way

RAW is a full-stack Over-The-Top (OTT) streaming platform designed to provide users with a seamless movie-streaming experience. The platform includes user authentication, movie discovery, subscription management, video streaming, and an administrative dashboard for managing movies and content.

The project is built using modern web technologies, with a scalable backend architecture and cloud-based storage for video content.

---

## 🚀 Features

### 👤 User Features

* User registration and login.
* Secure authentication and authorization.
* Browse movies and view movie details.
* View movie posters, descriptions, and trailers.
* Stream movies using HTTP Live Streaming (HLS).
* Subscription-based video quality restrictions.
* Support for multiple video resolutions.
* User dashboard.
* Responsive user interface.

### 🛡️ Admin Features

* Secure administrator login.
* Admin dashboard.
* Add and manage movies.
* Update movie information.
* Manage movie posters and trailers.
* Configure available streaming qualities.
* Manage movie metadata.
* Monitor movie processing status.

### 🎥 Video Streaming

* HLS-based video-on-demand streaming.
* Support for multiple video resolutions.
* Video storage separate from the database.
* Master playlists and video segments.
* External object storage integration.
* Subscription-based playback authorization.

### 💳 Subscription Management

* Subscription plans with different video quality limits.
* Default streaming quality of 480p.
* Support for 720p and 1080p plans, subject to configuration.
* Backend validation of subscription permissions.
* Subscription interface for users.

*Feature availability depends on the implemented application configuration.*

---

## 🛠️ Technology Stack

### Frontend

* React.js
* Vite
* JavaScript
* Tailwind CSS
* HTML5
* CSS3

### Backend

* Java
* Spring Boot
* Spring Security
* Spring Data JPA
* REST APIs
* Maven
* JWT authentication, if configured

### Database

* PostgreSQL

### Video Streaming and Storage

* FFmpeg
* HLS (HTTP Live Streaming)
* Cloudflare R2 or compatible object storage
* hls.js for browser-based HLS playback

### Development Tools

* IntelliJ IDEA
* Visual Studio Code
* Postman
* Git
* GitHub

---

## 🏗️ System Architecture

```text
                    RAW OTT PLATFORM
                           |
             +-------------+-------------+
             |                           |
             v                           v
       React Frontend              Admin Dashboard
             |
             v
       Spring Boot Backend
             |
       +-----+------------------+
       |                        |
       v                        v
 PostgreSQL Database       Video Storage
       |                        |
       v                        v
 Movie Metadata           HLS Playlists
 User Accounts            Video Segments
 Subscriptions            Multiple Qualities
       |                        |
       +------------+-----------+
                    |
                    v
              Video Player
```

### Architecture Overview

* **Frontend:** Provides the user interface for browsing, authentication, subscriptions, and playback.
* **Backend:** Handles business logic, authentication, authorization, movie metadata, and playback access.
* **Database:** Stores structured information such as users, movies, and subscription records.
* **Object Storage:** Stores actual video files, HLS playlists, and video segments.
* **Video Player:** Plays authorized video streams in supported browsers.

---

## 📁 Project Structure

The following is an example structure. Adjust the directory names to match your actual project.

```text
RAW/
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/raw/backend/
│   │       │       ├── controller/
│   │       │       ├── service/
│   │       │       ├── repository/
│   │       │       ├── entity/
│   │       │       ├── dto/
│   │       │       ├── exception/
│   │       │       ├── security/
│   │       │       └── config/
│   │       └── resources/
│   │           └── application.properties
│   └── pom.xml
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── assets/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

Install the following tools before running the project:

* Java Development Kit (JDK 17 or the version required by your project).
* Maven, or the Maven wrapper included in the repository.
* Node.js and npm.
* PostgreSQL.
* Git.
* FFmpeg for video transcoding and HLS generation.

Optional tools include IntelliJ IDEA, Visual Studio Code, and Postman.

---

## 💻 Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd RAW
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Configure the Database

Create a PostgreSQL database for RAW.

For example:

```sql
CREATE DATABASE raw_ott;
```

Configure the database connection using environment variables or a local configuration file.

Example environment variables:

```env
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password
DATABASE_URL=your_jdbc_connection_url
```

Do not commit real credentials to GitHub.

### 3. Run the Backend

Navigate to the backend directory:

```bash
cd backend
```

Build the project:

```bash
mvn clean package
```

Start the Spring Boot application:

```bash
mvn spring-boot:run
```

The backend typically runs at:

```text
http://localhost:8080
```

The actual port depends on your application configuration.

### 4. Run the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Vite development server typically runs at:

```text
http://localhost:5173
```

Open the displayed address in your browser.

---

## 🎞️ Video Processing and HLS Streaming

RAW is designed to support HLS-based video-on-demand streaming.

### Video Processing Workflow

1. An administrator selects a video file.
2. The backend validates the upload.
3. The video is stored outside PostgreSQL.
4. FFmpeg processes the video into HLS-compatible formats.
5. HLS playlists and video segments are generated.
6. The processed files are uploaded to object storage.
7. The application stores movie metadata and playback references in PostgreSQL.
8. The backend validates playback permissions.
9. The frontend plays the authorized video stream.

### Example HLS Structure

```text
movie-101/
├── master.m3u8
├── 480p/
│   ├── index.m3u8
│   └── segments/
├── 720p/
│   ├── index.m3u8
│   └── segments/
└── 1080p/
    ├── index.m3u8
    └── segments/
```

The actual resolutions and directory structure depend on the video-processing configuration.

**Important:** PostgreSQL should store movie metadata and storage references, not the actual movie binaries.

---

## 🗄️ Database Design

The database can contain tables or entities for the following resources, depending on the implemented features:

| Entity       | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| User         | Stores user account information and roles                    |
| Movie        | Stores movie metadata and playback references                |
| Subscription | Stores user subscription information                         |
| MovieVersion | Stores available video versions and quality metadata         |
| Role         | Represents application permissions, if modeled separately    |
| Payment      | Stores payment records, if payment processing is implemented |

### Example Movie Fields

* `id`
* `title`
* `description`
* `duration`
* `posterUrl`
* `backdropUrl`
* `trailerUrl`
* `hlsMasterUrl`
* `movieStatus`

The exact fields should match the application's entity definitions.

---

## 🔐 Security

Security is an important part of the RAW platform.

Recommended security practices include:

* Store passwords using a secure password-hashing algorithm.
* Keep secrets and database credentials in environment variables.
* Restrict administrator functionality to authorized administrators.
* Validate permissions on protected API endpoints.
* Verify subscription entitlements on the backend.
* Protect private video content using an appropriate authorization mechanism.
* Configure CORS for trusted frontend origins.
* Use HTTPS in production.
* Validate incoming requests and uploaded files.
* Avoid exposing sensitive information in error responses.

Never commit passwords, JWT secrets, cloud-storage keys, or other credentials to the repository.

---

## ☁️ Deployment

RAW can be deployed using separate hosting services for each component.

| Component     | Example Service |
| ------------- | --------------- |
| Frontend      | Vercel          |
| Backend       | Render          |
| PostgreSQL    | Neon            |
| Video Storage | Cloudflare R2   |
| Source Code   | GitHub          |

### Deployment Overview

1. Push the project to GitHub.
2. Create a managed PostgreSQL database.
3. Configure production database credentials.
4. Deploy the Spring Boot backend.
5. Configure backend environment variables.
6. Deploy the React frontend.
7. Set the production API base URL.
8. Configure CORS and authentication.
9. Set up object storage and video delivery.
10. Test authentication, movie browsing, and playback.

Hosting plans, resource limits, and pricing depend on the selected providers.

---

## 🧪 Testing

Test the following functionality before releasing the application:

* User registration and login.
* Administrator authentication.
* Movie listing and details.
* Movie metadata management.
* Trailer playback.
* HLS video playback.
* Subscription validation.
* Video quality restrictions.
* API authorization.
* Database connectivity.
* Production frontend-to-backend communication.
* Error handling and responsive design.

---

## 🔮 Future Enhancements

Potential future improvements include:

* Search and advanced movie filtering.
* Personalized movie recommendations.
* Watchlists and favorites.
* Continue-watching functionality.
* Watch history.
* Multiple subtitle and audio tracks.
* Improved adaptive bitrate streaming.
* Payment gateway integration.
* Email notifications.
* Analytics dashboards.
* Video processing queues.
* Automated monitoring and backups.
* Custom domain and CDN integration.

These are planned enhancements unless already implemented.

---

## ⚠️ Legal and Content Requirements

RAW should stream only content for which the platform has the necessary distribution and streaming rights.

Administrators should ensure that uploaded movies, trailers, artwork, subtitles, and audio tracks are authorized for use.

---

## 👨‍💻 Development

Contributions and improvements should follow the project's existing code structure and conventions.

Before submitting changes:

1. Test the frontend.
2. Build and test the backend.
3. Check API integrations.
4. Review security-sensitive changes.
5. Update documentation where necessary.

---

## 📄 License

Choose and add an appropriate license before distributing the project publicly.

If the project is private or you have not selected a license, do not assume that other people have permission to reuse or redistribute its code.

---

**RAW OTT Platform — Bringing entertainment and technology together.** 🎬
