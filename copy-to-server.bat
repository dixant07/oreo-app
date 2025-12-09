@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo WEBGAMES DEPLOYMENT: FILE TRANSFER
echo ==========================================

:: Configuration
set "SERVER_IP=68.183.225.118"
set "SERVER_USER=root"
set "SSH_KEY=C:\Users\dikshant\.ssh\id_ed25519"
set "DEFAULT_DEST=/opt/web-games-platform"

:: Destination Path Prompt
if "%DEST_DIR%"=="" (
    set /p "DEST_DIR=Enter Destination Path (default %DEFAULT_DEST%): "
)
if "%DEST_DIR%"=="" set "DEST_DIR=%DEFAULT_DEST%"

echo.
echo ------------------------------------------
echo Target:  %SERVER_USER%@%SERVER_IP%
echo Key:     %SSH_KEY%
echo Path:    %DEST_DIR%
echo ------------------------------------------
echo.

:: 1. Create Deployment Bundle
echo [1/4] Creating deployment bundle (excluding node_modules, dist, .vscode, .git)...
:: Using tar to create a compressed archive, automatically excluding unwanted folders
tar --exclude "node_modules" --exclude "dist" --exclude ".vscode" --exclude ".git" -czf deployment_bundle.tar.gz server games Dockerfile deploy-docker.sh .dockerignore
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to create tar bundle. Ensure 'tar' is installed on your system.
    pause
    exit /b %ERRORLEVEL%
)

:: 2. Create Remote Directory
echo [2/4] Creating remote directory...
ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "mkdir -p %DEST_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to connect to server. Check IP and SSH Key.
    del deployment_bundle.tar.gz
    pause
    exit /b %ERRORLEVEL%
)

:: 3. Upload Bundle
echo [3/4] Uploading bundle...
scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no deployment_bundle.tar.gz %SERVER_USER%@%SERVER_IP%:%DEST_DIR%/
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload bundle.
    del deployment_bundle.tar.gz
    pause
    exit /b %ERRORLEVEL%
)

:: 4. Extract and Cleanup on Server
echo [4/4] Extracting bundle on server and fixing line endings...
:: Extracts the bundle, removes the tar file, and ensures the shell script has Linux line endings
ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "cd %DEST_DIR% && tar -xzf deployment_bundle.tar.gz && rm deployment_bundle.tar.gz && sed -i 's/\r$//' deploy-docker.sh"

:: 5. Local Cleanup
del deployment_bundle.tar.gz

echo.
echo ==========================================
echo SUCCESS: Files Transferred!
echo ==========================================
echo To deploy, run the following commands on your server:
echo.
echo   ssh -i "%SSH_KEY%" %SERVER_USER%@%SERVER_IP%
echo   cd %DEST_DIR%
echo   chmod +x deploy-docker.sh
echo   ./deploy-docker.sh
echo.
echo ==========================================
pause
