-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "CommonStatus" AS ENUM ('ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('DIR', 'PAGE', 'LINK', 'BUTTON');

-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ENABLED',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CommonStatus" NOT NULL DEFAULT 'ENABLED',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppModule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" "CommonStatus" NOT NULL DEFAULT 'ENABLED',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "moduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "path" TEXT,
    "component" TEXT,
    "icon" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "type" "MenuType" NOT NULL DEFAULT 'PAGE',
    "permissionCode" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "status" "CommonStatus" NOT NULL DEFAULT 'ENABLED',
    "externalUrl" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RoleModule" (
    "roleId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "RoleModule_pkey" PRIMARY KEY ("roleId","moduleId")
);

-- CreateTable
CREATE TABLE "RoleMenu" (
    "roleId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,

    CONSTRAINT "RoleMenu_pkey" PRIMARY KEY ("roleId","menuId")
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "payload" JSONB,
    "status" "LogStatus" NOT NULL DEFAULT 'SUCCESS',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaderId" TEXT,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateSequence
CREATE SEQUENCE "Article_slug_seq"
    START WITH 20000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT (nextval('"Article_slug_seq"'::regclass))::text,
    "summary" TEXT,
    "contentMarkdown" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

ALTER SEQUENCE "Article_slug_seq" OWNED BY "Article"."slug";

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleTag" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateTable
CREATE TABLE "ArticleLike" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "visitorKeyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AppModule_code_key" ON "AppModule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_path_key" ON "Menu"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_permissionCode_key" ON "Menu"("permissionCode");

-- CreateIndex
CREATE INDEX "Menu_moduleId_parentId_idx" ON "Menu"("moduleId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_id_moduleId_key" ON "Menu"("id", "moduleId");

-- CreateIndex
CREATE INDEX "RoleModule_moduleId_idx" ON "RoleModule"("moduleId");

-- CreateIndex
CREATE INDEX "RoleMenu_roleId_moduleId_idx" ON "RoleMenu"("roleId", "moduleId");

-- CreateIndex
CREATE INDEX "RoleMenu_menuId_moduleId_idx" ON "RoleMenu"("menuId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "ArticleTag_tagId_idx" ON "ArticleTag"("tagId");

-- CreateIndex
CREATE INDEX "ArticleLike_articleId_createdAt_idx" ON "ArticleLike"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "ArticleLike_visitorKeyHash_idx" ON "ArticleLike"("visitorKeyHash");

-- CreateIndex
CREATE INDEX "ArticleLike_createdAt_idx" ON "ArticleLike"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleLike_articleId_visitorKeyHash_key" ON "ArticleLike"("articleId", "visitorKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AppModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_parentId_moduleId_fkey" FOREIGN KEY ("parentId", "moduleId") REFERENCES "Menu"("id", "moduleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleModule" ADD CONSTRAINT "RoleModule_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleModule" ADD CONSTRAINT "RoleModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AppModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenu" ADD CONSTRAINT "RoleMenu_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenu" ADD CONSTRAINT "RoleMenu_roleId_moduleId_fkey" FOREIGN KEY ("roleId", "moduleId") REFERENCES "RoleModule"("roleId", "moduleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenu" ADD CONSTRAINT "RoleMenu_menuId_moduleId_fkey" FOREIGN KEY ("menuId", "moduleId") REFERENCES "Menu"("id", "moduleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationLog" ADD CONSTRAINT "OperationLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

