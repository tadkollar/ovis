# Build the python wheel
python setup.py bdist_wheel

# Create the build dirs
rm -rf dist/mac-x64
rm -rf dist/win-x64
rm -rf dist/linux-x64
rm -rf dist/Release
mkdir dist/mac-x64
mkdir dist/win-x64
mkdir dist/linux-x64
mkdir dist/Release

# Build app
npm run dist

# Copy over the files
cp -r dist/mac/* dist/mac-x64/
cp -r dist/win-unpacked/* dist/win-x64/
cp -r dist/linux-unpacked/* dist/linux-x64/

# Copy over wheel and install
cp dist/ZuneServerReqs-1.0-py2.py3-none-any.whl dist/mac-x64/
cp dist/ZuneServerReqs-1.0-py2.py3-none-any.whl dist/win-x64/
cp dist/ZuneServerReqs-1.0-py2.py3-none-any.whl dist/linux-x64/
cp -r install_server_requirements.sh dist/mac-x64/
cp -r install_server_requirements.sh dist/linux-x64/
cp -r install_server_requirements.cmd dist/win-x64/

# Zip up folders
zip -r dist/mac-x64.zip dist/mac-x64
zip -r dist/linux-x64.zip dist/linux-x64
zip -r dist/win-x64.zip dist/win-x64

# Copy to Release folder
cp dist/mac-x64.zip dist/Release/
cp dist/win-x64.zip dist/Release/
cp dist/linux-x64.zip dist/Release/