import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export function useWhatsappInbox(branches = [], defaultChannel = 'baileys') {
    const [activeTab, setActiveTab] = useState(defaultChannel); // 'baileys'
    const [selectedBranch, setSelectedBranch] = useState(branches[0]?.code || 'solo');
    
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Meta Templates
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Fetch conversation contacts list based on active tab & branch
    const fetchContacts = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoadingContacts(true);
        try {
            let res;
            if (activeTab === 'official') {
                res = await axios.get(route('admin.whatsapp.official.conversations'));
            } else {
                res = await axios.get(route('admin.whatsapp.baileys.conversations', selectedBranch));
            }
            if (res.data.status === 'success') {
                setContacts(res.data.data);
                setSelectedContact(prev => {
                    if (!prev && res.data.data.length > 0) {
                        return res.data.data[0];
                    }
                    return prev;
                });
            }
        } catch (err) {
            console.error('Failed to fetch contacts:', err);
        } finally {
            if (!isSilent) setLoadingContacts(false);
        }
    }, [activeTab, selectedBranch]);

    // Fetch message history for selected contact
    const fetchMessages = useCallback(async (contact, isSilent = false) => {
        if (!contact) return;
        if (!isSilent) setLoadingMessages(true);
        try {
            const res = await axios.get(route('admin.whatsapp.chat-history'), {
                params: {
                    phone: contact.phone,
                    channel: activeTab,
                    branch: selectedBranch,
                }
            });
            if (res.data.status === 'success') {
                setMessages(res.data.messages);
            }
        } catch (err) {
            console.error('Failed to fetch chat history:', err);
        } finally {
            if (!isSilent) setLoadingMessages(false);
        }
    }, [activeTab, selectedBranch]);

    // Fetch official templates
    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const res = await axios.get(route('admin.whatsapp.official.templates'));
            if (res.data.status === 'success') {
                setTemplates(res.data.templates);
            }
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    // Handle sending standard message
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!inputMessage.trim() || !selectedContact || sending) return;

        setSending(true);
        const textToSend = inputMessage;
        setInputMessage('');

        try {
            let res;
            if (activeTab === 'official') {
                res = await axios.post(route('admin.whatsapp.official.send'), {
                    phone: selectedContact.phone,
                    message: textToSend,
                });
            } else {
                res = await axios.post(route('admin.whatsapp.send'), {
                    branch: selectedBranch,
                    phone: selectedContact.phone,
                    message: textToSend,
                });
            }

            // Optimistic update to UI
            const newMsg = {
                id: 'msg_' + Date.now(),
                sender: 'admin',
                text: textToSend,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
            };
            setMessages((prev) => [...prev, newMsg]);

            // Refresh contact's last message snippet silently
            fetchContacts(true);
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Gagal mengirim pesan: ' + (err.response?.data?.message || err.message));
        } finally {
            setSending(false);
        }
    };

    // Send WhatsApp Meta Approved Template
    const handleSendTemplate = async (template, variables = {}) => {
        if (!selectedContact || sending) return;
        setSending(true);

        try {
            let filledBody = template.body;
            Object.keys(variables).forEach((key, idx) => {
                filledBody = filledBody.replace(`{{${idx + 1}}}`, variables[key]);
            });

            await axios.post(route('admin.whatsapp.official.send'), {
                phone: selectedContact.phone,
                template_name: template.name,
                variables: variables,
                message: filledBody,
            });

            const newMsg = {
                id: 'msg_tpl_' + Date.now(),
                sender: 'admin',
                text: filledBody,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
                template_name: template.name,
            };
            setMessages((prev) => [...prev, newMsg]);
            setIsTemplateModalOpen(false);
            fetchContacts(true);
        } catch (err) {
            console.error('Failed to send template:', err);
            alert('Gagal mengirim template: ' + (err.response?.data?.message || err.message));
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        setSelectedContact(null);
        setMessages([]);
        fetchContacts();
    }, [activeTab, selectedBranch]);

    useEffect(() => {
        if (selectedContact) {
            fetchMessages(selectedContact);
        }
    }, [selectedContact]);

    // Real-time listener for incoming messages via Laravel Reverb / Echo
    useEffect(() => {
        if (!window.Echo) return;

        console.log('📡 [INBOX] Echo listening on whatsapp-messages (.message.received)');

        const channel = window.Echo.channel('whatsapp-messages')
            .listen('.message.received', (e) => {
                console.log('⚡ [INBOX] Real-time WA Message Received:', e);
                
                const incomingPhone = e.phone || e.lead?.phone || '';
                const incomingDigits = incomingPhone.replace(/[^0-9]/g, '');
                const incomingName = e.name || 'No Name';
                const isLead = e.is_lead !== undefined ? e.is_lead : (incomingName !== 'No Name');
                const incomingMsg = e.message || '';
                const incomingTime = e.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const incomingLeadId = e.lead_id || e.lead?.id;

                // 1. Immediately update contacts in memory (instant UI response)
                setContacts((prevContacts) => {
                    const existingIndex = prevContacts.findIndex(c => {
                        const cleanC = (c.phone || '').replace(/[^0-9]/g, '');
                        return cleanC.slice(-8) === incomingDigits.slice(-8);
                    });

                    if (existingIndex !== -1) {
                        const updated = {
                            ...prevContacts[existingIndex],
                            last_message: incomingMsg,
                            last_message_time: incomingTime,
                            sort_timestamp: Date.now(),
                        };
                        const remaining = prevContacts.filter((_, idx) => idx !== existingIndex);
                        return [updated, ...remaining];
                    } else {
                        // Prepend brand new contact immediately
                        const newContact = {
                            id: 'baileys_' + (incomingLeadId || Date.now()),
                            name: incomingName || 'No Name',
                            phone: incomingPhone,
                            is_lead: isLead,
                            type: isLead ? 'lead' : 'non-lead',
                            crm_id: incomingLeadId,
                            avatar: null,
                            last_message: incomingMsg,
                            last_message_time: incomingTime,
                            sort_timestamp: Date.now(),
                            unread_count: 1,
                            channel: activeTab,
                        };
                        return [newContact, ...prevContacts];
                    }
                });

                // 2. If current active chat matches the incoming message sender, append to chat window
                if (selectedContact) {
                    const cleanCurrent = (selectedContact.phone || '').replace(/[^0-9]/g, '');
                    if (incomingDigits && cleanCurrent && (incomingDigits.slice(-8) === cleanCurrent.slice(-8))) {
                        const newMsg = {
                            id: 'msg_in_' + Date.now(),
                            sender: 'contact',
                            text: incomingMsg,
                            timestamp: incomingTime,
                            status: 'read',
                        };
                        setMessages((prev) => [...prev, newMsg]);
                    }
                }

                // 3. Play audio chime
                try {
                    const audio = new Audio('/sounds/notification.mp3');
                    audio.play().catch(() => {});
                } catch (err) {}

                // 4. Background re-fetch to ensure perfect server state
                fetchContacts(true);
            });

        return () => {
            channel.stopListening('.message.received');
        };
    }, [selectedContact, activeTab, fetchContacts]);

    // Polling fallback every 4 seconds to guarantee near real-time sync
    useEffect(() => {
        const interval = setInterval(() => {
            fetchContacts(true);
            if (selectedContact) {
                fetchMessages(selectedContact, true);
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [fetchContacts, fetchMessages, selectedContact]);

    const filteredContacts = contacts.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    return {
        activeTab,
        setActiveTab,
        selectedBranch,
        setSelectedBranch,
        contacts: filteredContacts,
        selectedContact,
        setSelectedContact,
        messages,
        inputMessage,
        setInputMessage,
        loadingContacts,
        loadingMessages,
        sending,
        searchQuery,
        setSearchQuery,
        handleSendMessage,
        handleSendTemplate,
        isTemplateModalOpen,
        setIsTemplateModalOpen,
        templates,
        loadingTemplates,
        fetchTemplates,
        refresh: () => {
            fetchContacts();
            if (selectedContact) fetchMessages(selectedContact);
        }
    };
}
