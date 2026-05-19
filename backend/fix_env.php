<?php
$f = '.env';
$c = file_get_contents($f);
// Remove null bytes and other non-printable characters
$c = preg_replace('/[^\x20-\x7E\r\n]/', '', $c);
// Ensure we don't have multiple MIDTRANS blocks
$lines = explode("\n", $c);
$newLines = [];
$seen = [];
foreach ($lines as $line) {
    $line = trim($line);
    if (empty($line)) continue;
    $parts = explode('=', $line, 2);
    if (count($parts) == 2) {
        $key = trim($parts[0]);
        if (!isset($seen[$key])) {
            $newLines[] = $line;
            $seen[$key] = true;
        }
    } else {
        $newLines[] = $line;
    }
}
file_put_contents($f, implode("\n", $newLines));
echo "Sanitized .env";
