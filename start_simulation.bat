@echo off
cd /d "%~dp0"
echo ========================================
echo  WUERFELSPIEL BALANCE-SIMULATION
echo  Starte 288.000 Spiele...
echo  Bitte warten (ca. 30 Sekunden)
echo ========================================
echo.
node simulate.js > simulation_ergebnis.txt 2>&1
echo.
echo Fertig! Ergebnis wird geoeffnet...
start "" "simulation_ergebnis.txt"
