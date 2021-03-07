<?php
if (empty($_POST)) {
?>
<html>
<head>
<title>EasyGraph to XState compiler</title>
<meta charset="utf8">
</head>
<body>
<form method="post">
<textarea name="easy" rows="25" cols="50"></textarea>
<div><button>Generate</button></div>
</form>
</body>
</html>
<?php
}
else {
	header('Content-Type: text/javascript');
	//header('Content-Disposition: attachment; filename="api.php"');
	$tmp = tempnam('/tmp', 'eg');
	file_put_contents($tmp, $_POST['easy']);
	passthru("../_build/default/bin/easy.exe $tmp 2>&1");
}
