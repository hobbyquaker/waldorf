## Classes

<dl>
<dt><a href="#log">log</a></dt>
<dd><p>Log to stdout/stderr. Messages are prefixed with a timestamp and the calling scripts path.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#pub">pub(channel, text)</a></dt>
<dd><p>Send Text to a Channel</p>
</dd>
<dt><a href="#sub">sub(pattern, callback)</a> ⇒ <code>subscriptionId</code></dt>
<dd><p>Add a Subscription that calls a Callback when pattern matches text said in a Channel</p>
</dd>
<dt><a href="#unsub">unsub(id)</a></dt>
<dd><p>Remove a Subscription</p>
</dd>
<dt><a href="#schedule">schedule(pattern, [options], callback)</a></dt>
<dd><p>Schedule recurring and one-shot events</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#subscribeCallback">subscribeCallback</a> : <code>function</code></dt>
<dd></dd>
</dl>

<a name="log"></a>

## log
Log to stdout/stderr. Messages are prefixed with a timestamp and the calling scripts path.

**Kind**: global class  

* [log](#log)
    * [.debug()](#log.debug)
    * [.info()](#log.info)
    * [.warn()](#log.warn)
    * [.error()](#log.error)

<a name="log.debug"></a>

### log.debug()
Log a debug message

**Kind**: static method of <code>[log](#log)</code>  

| Type |
| --- |
| <code>\*</code> | 

<a name="log.info"></a>

### log.info()
Log an info message

**Kind**: static method of <code>[log](#log)</code>  

| Type |
| --- |
| <code>\*</code> | 

<a name="log.warn"></a>

### log.warn()
Log a warning message

**Kind**: static method of <code>[log](#log)</code>  

| Type |
| --- |
| <code>\*</code> | 

<a name="log.error"></a>

### log.error()
Log an error message

**Kind**: static method of <code>[log](#log)</code>  

| Type |
| --- |
| <code>\*</code> | 

<a name="pub"></a>

## pub(channel, text)
Send Text to a Channel

**Kind**: global function  

| Param | Type |
| --- | --- |
| channel | <code>string</code> | 
| text | <code>string</code> | 

<a name="sub"></a>

## sub(pattern, callback) ⇒ <code>subscriptionId</code>
Add a Subscription that calls a Callback when pattern matches text said in a Channel

**Kind**: global function  

| Param | Type |
| --- | --- |
| pattern | <code>string</code> \| <code>RegExp</code> | 
| callback | <code>[subscribeCallback](#subscribeCallback)</code> | 

**Example**  
```js
// Respond "Hi @User" when someone says "Hello" or "hello"
sub(/[Hh]ello/, (match, user, channel) => pub(`Hi @${user}`));
```
<a name="unsub"></a>

## unsub(id)
Remove a Subscription

**Kind**: global function  

| Param | Type |
| --- | --- |
| id | <code>subscriptionId</code> | 

<a name="schedule"></a>

## schedule(pattern, [options], callback)
Schedule recurring and one-shot events

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| pattern | <code>string</code> \| <code>Date</code> \| <code>Object</code> \| <code>Array.&lt;mixed&gt;</code> | pattern or array of patterns. May be cron style string, Date object or node-schedule object literal. See [https://github.com/tejasmanohar/node-schedule/wiki](https://github.com/tejasmanohar/node-schedule/wiki) |
| [options] | <code>Object</code> |  |
| [options.random] | <code>number</code> | random delay execution in seconds. Has to be positive |
| callback | <code>function</code> | is called with no arguments |

**Example**  
```js
// every full Hour.
schedule('0 * * * *', callback);

// Monday till friday, random between 7:30am an 8:00am
schedule('30 7 * * 1-5', {random: 30 * 60}, callback);

// once on 21. December 2018 at 5:30am
schedule(new Date(2018, 12, 21, 5, 30, 0), callback);

// every Sunday at 2:30pm
schedule({hour: 14, minute: 30, dayOfWeek: 0}, callback);
```
<a name="subscribeCallback"></a>

## subscribeCallback : <code>function</code>
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> \| <code>Array.&lt;string&gt;</code> | text or .match(RegExp) array |
| user | <code>string</code> | the Name of the User that said something |
| channel | <code>string</code> | the Channel where something was said |

